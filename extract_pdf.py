import sys
import os

# Try to find a PDF library
try:
    import pypdf
    print("Using pypdf")
    from pypdf import PdfReader
    
    def read_pdf(path):
        reader = PdfReader(path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

except ImportError:
    try:
        import PyPDF2
        print("Using PyPDF2")
        from PyPDF2 import PdfReader
        
        def read_pdf(path):
            reader = PdfReader(path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
    except ImportError:
        print("No PDF library found (pypdf or PyPDF2).")
        sys.exit(1)

if __name__ == "__main__":
    target = "TEST LIST.pdf"
    if not os.path.exists(target):
        print(f"File not found: {target}")
    else:
        try:
            content = read_pdf(target)
            print("--- START CONTENT ---")
            print(content)
            print("--- END CONTENT ---")
        except Exception as e:
            print(f"Failed to read PDF: {e}")
