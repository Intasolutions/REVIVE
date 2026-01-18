from django.db import transaction
from rest_framework import serializers
from .models import (
    Supplier, PharmacyStock, PurchaseInvoice, PurchaseItem,
    PharmacySale, PharmacySaleItem
)


class SupplierSerializer(serializers.ModelSerializer):
    supplier_id = serializers.UUIDField(source='id', read_only=True)

    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['supplier_id', 'created_at', 'updated_at']


class PharmacyStockSerializer(serializers.ModelSerializer):
    med_id = serializers.UUIDField(source='id', read_only=True)

    class Meta:
        model = PharmacyStock
        fields = '__all__'
        read_only_fields = ['med_id', 'created_at', 'updated_at']


class PurchaseItemSerializer(serializers.ModelSerializer):
    item_id = serializers.UUIDField(source='id', read_only=True)

    class Meta:
        model = PurchaseItem
        fields = '__all__'
        read_only_fields = ['item_id', 'purchase', 'created_at', 'updated_at']


class PurchaseInvoiceSerializer(serializers.ModelSerializer):
    purchase_id = serializers.UUIDField(source='id', read_only=True)
    # ✅ make items writable (bulk upload via JSON)
    items = PurchaseItemSerializer(many=True, write_only=True)
    items_detail = PurchaseItemSerializer(source='items', many=True, read_only=True)

    class Meta:
        model = PurchaseInvoice
        fields = '__all__'
        read_only_fields = ['purchase_id', 'created_by', 'created_at', 'updated_at']

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])

        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None

        invoice = PurchaseInvoice.objects.create(
            created_by=user if user and user.is_authenticated else None,
            **validated_data
        )

        # Create purchase items + Update/Create stock
        for item in items_data:
            PurchaseItem.objects.create(purchase=invoice, **item)

            qty_in = (item.get('qty') or 0) + (item.get('free_qty') or 0)

            # Stock match logic (MANDATORY): product_name + batch_no + expiry + supplier
            stock, created = PharmacyStock.objects.get_or_create(
                name=item['product_name'],
                batch_no=item['batch_no'],
                expiry_date=item['expiry_date'],
                supplier=invoice.supplier,
                defaults={
                    'barcode': item.get('barcode', '') or '',
                    'mrp': item['mrp'],
                    'selling_price': item.get('ptr', item['mrp']),
                    'qty_available': qty_in,
                    'hsn': item.get('hsn', '') or '',
                    'gst_percent': item.get('gst_percent', 0) or 0,
                    'manufacturer': item.get('manufacturer', '') or '',
                    'is_deleted': False,
                }
            )

            if not created:
                stock.qty_available = stock.qty_available + qty_in
                if item.get('barcode'):
                    stock.barcode = item['barcode']
                stock.mrp = item['mrp']
                stock.selling_price = item.get('ptr', item['mrp'])
                stock.hsn = item.get('hsn', stock.hsn)
                stock.gst_percent = item.get('gst_percent', stock.gst_percent)
                stock.manufacturer = item.get('manufacturer', stock.manufacturer)
                stock.is_deleted = False
                stock.save()

        return invoice


class PharmacySaleItemSerializer(serializers.ModelSerializer):
    item_id = serializers.UUIDField(source='id', read_only=True)
    med_name = serializers.CharField(source='med_stock.name', read_only=True)
    batch_no = serializers.CharField(source='med_stock.batch_no', read_only=True)
    expiry_date = serializers.DateField(source='med_stock.expiry_date', read_only=True)

    class Meta:
        model = PharmacySaleItem
        fields = '__all__'
        read_only_fields = ['item_id', 'created_at', 'updated_at', 'amount', 'sale']


class PharmacySaleSerializer(serializers.ModelSerializer):
    sale_id = serializers.UUIDField(source='id', read_only=True)
    # allow creating items in same request
    items = PharmacySaleItemSerializer(many=True)

    class Meta:
        model = PharmacySale
        fields = '__all__'
        read_only_fields = ['sale_id', 'sale_date', 'created_at', 'updated_at', 'total_amount']

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])

        sale = PharmacySale.objects.create(total_amount=0, **validated_data)

        total = 0
        for item in items_data:
            med_stock = item['med_stock']
            qty = item['qty']

            if med_stock.is_deleted:
                raise serializers.ValidationError("Selected medicine stock is deleted.")

            if med_stock.qty_available < qty:
                raise serializers.ValidationError(
                    f"Not enough stock for {med_stock.name} ({med_stock.batch_no}). Available: {med_stock.qty_available}"
                )

            unit_price = item.get('unit_price') or med_stock.selling_price
            amount = unit_price * qty
            total += amount

            # reduce stock
            med_stock.qty_available -= qty
            med_stock.save()

            PharmacySaleItem.objects.create(
                sale=sale,
                med_stock=med_stock,
                qty=qty,
                unit_price=unit_price,
                amount=amount,
            )

        sale.total_amount = total
        sale.save()
        return sale
