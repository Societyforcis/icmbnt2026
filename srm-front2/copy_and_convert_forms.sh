#!/bin/bash

# Create backup of HTML files in public/docs
mkdir -p public/docs
cp -f public/docs/ICMBNT_2025_Registration_Form.html public/docs/ICMBNT_2025_Registration_Form.html.bak
cp -f public/docs/ICMBNT_2025_Copyright_Form.html public/docs/ICMBNT_2025_Copyright_Form.html.bak

# Copy HTML files to public/images
mkdir -p public/images
cp -f public/docs/ICMBNT_2025_Registration_Form.html public/images/
cp -f public/docs/ICMBNT_2025_Copyright_Form.html public/images/

# Check if wkhtmltopdf is installed
if command -v wkhtmltopdf &> /dev/null; then
    echo "Converting HTML to PDF using wkhtmltopdf..."
    cd public/images
    wkhtmltopdf ICMBNT_2025_Registration_Form.html ICMBNT_2025_Registration_Form.pdf
    wkhtmltopdf ICMBNT_2025_Copyright_Form.html ICMBNT_2025_Copyright_Form.pdf
    cd ../..
    echo "PDF forms created successfully in public/images folder!"
else
    echo "wkhtmltopdf is not installed. Please install it to generate PDFs automatically."
    echo "For now, you can manually convert the HTML files to PDF using your browser's print function."
    echo "HTML files have been copied to public/images folder."
fi

# Instructions
echo ""
echo "The forms are now available at:"
echo "- public/images/ICMBNT_2025_Registration_Form.pdf"
echo "- public/images/ICMBNT_2025_Copyright_Form.pdf"
echo ""
echo "These files will be accessible via the download links in the Registration page."
