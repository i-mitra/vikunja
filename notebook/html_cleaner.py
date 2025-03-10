#!/usr/bin/env python3
import sys
import os
from bs4 import BeautifulSoup

def make_soup(input_path):
    with open(input_path, 'r') as file:
        html_content = file.read()
    soup = BeautifulSoup(html_content, 'html.parser')
    if not soup:
        print("Failed to parse HTML")
        exit()
    return soup

def clean_tags(soup):
    # remove all style tags
    for style_tag in soup.find_all('style'):
        style_tag.decompose()

    # remove all script tags
    for script_tag in soup.find_all('script'):
        script_tag.decompose()

    # remove <path> within <svg>
    for svg_tag in soup.find_all('svg'):
        for path_tag in svg_tag.find_all('path'):
            path_tag.decompose()
    
    return soup

def clean_tag_attributes(soup):
    """
    only keep the class and unique vue identifier for each element
    """
    for tag in soup.find_all(True): 
        attrs = dict(tag.attrs)
        new_attrs = {}
        
        # Keep class attributes
        if 'class' in attrs:
            new_attrs['class'] = attrs['class']
        # Keep Vue.js component identifiers (data-v-*)
        for attr in attrs:
            if attr.startswith('data-v-'):
                new_attrs[attr] = attrs[attr]

        tag.attrs = new_attrs

    return soup

def export_soup(soup, output_path):
    cleaned_html = soup.prettify()
    with open(output_path, 'w') as file:
        file.write(cleaned_html)

    print(f"Cleaned HTML file saved to {output_path}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python html_preprocess.py <input_html_file> [output_html_file]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    # If output path is not provided, create one based on input filename
    if len(sys.argv) >= 3:
        output_path = sys.argv[2]
    else:
        base_name = os.path.basename(input_path)
        file_name, file_ext = os.path.splitext(base_name)
        output_path = f"{file_name}_cleaned{file_ext}"
    
    # Process the HTML
    soup = make_soup(input_path)
    soup = clean_tags(soup)
    soup = clean_tag_attributes(soup)
    export_soup(soup, output_path)

if __name__ == "__main__":
    main()