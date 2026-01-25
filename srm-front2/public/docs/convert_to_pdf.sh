#!/bin/bash
# This script requires wkhtmltopdf to be installed
# You can install it on Ubuntu with: sudo apt-get install wkhtmltopdf
# On macOS with Homebrew: brew install wkhtmltopdf

wkhtmltopdf ICMBNT_2026_Registration_Form.html ICMBNT_2026_Registration_Form.pdf
wkhtmltopdf ICMBNT_2026_Copyright_Form.html ICMBNT_2026_Copyright_Form.pdf

echo "Conversion complete! PDF forms are now ready."
