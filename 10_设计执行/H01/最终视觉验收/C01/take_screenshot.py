import os
from pathlib import Path
from playwright.sync_api import sync_playwright
import time
from PIL import Image

D = Path(__file__).resolve().parent
html_path = D / 'index.html'
out_dir = D / 'rendered'
out_dir.mkdir(exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1200, 'height': 1600})
    page.goto(html_path.as_uri())
    page.wait_for_timeout(1000)

    for mode in ['full', 'compact']:
        el = page.locator(f'#phone-390-{mode}')
        path = out_dir / f'C01_390_{mode}.png'
        el.screenshot(path=str(path))
        print(f"Saved {path}")
    
    # Generate side-by-side comparison
    try:
        ref_full = D.parent / '视觉参考' / 'C01_首页_完整态_用户参考原图.png'
        if ref_full.exists():
            img1 = Image.open(ref_full)
            img2 = Image.open(out_dir / 'C01_390_full.png')
            
            # Resize img2 width to match img1 width for side-by-side
            ratio = img1.width / img2.width
            img2 = img2.resize((img1.width, int(img2.height * ratio)))
            
            # Calculate height difference, create canvas
            max_height = max(img1.height, img2.height)
            total_width = img1.width + img2.width + 40 # 40px gap
            
            combined = Image.new('RGB', (total_width, max_height), (255, 255, 255))
            combined.paste(img1, (0, 0))
            combined.paste(img2, (img1.width + 40, 0))
            
            compare_path = D.parent / '视觉参考' / 'C01_原图与新设计稿并排对比.png'
            combined.save(compare_path)
            print(f"Saved comparison to {compare_path}")
    except Exception as e:
        print(f"Failed to create comparison: {e}")

    browser.close()
