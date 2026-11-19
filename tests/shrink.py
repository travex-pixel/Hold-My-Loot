# Make small JPEG copies of a screenshot set for review pages: python3 tests/shrink.py review/before review/img/before
import sys, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
n = 0
for vp in sorted(os.listdir(src)):
    d = os.path.join(src, vp)
    if not os.path.isdir(d): continue
    os.makedirs(os.path.join(dst, vp), exist_ok=True)
    for f in sorted(os.listdir(d)):
        if not f.endswith('.png'): continue
        im = Image.open(os.path.join(d, f)).convert('RGB')
        w, h = im.size
        s = min(1.0, 600 / w)
        if h > 2400: s = min(s, 2400 / h)
        im = im.resize((int(w * s), int(h * s)), Image.LANCZOS)
        im.save(os.path.join(dst, vp, f[:-4] + '.jpg'), 'JPEG', quality=78, optimize=True)
        n += 1
print('wrote', n, 'images to', dst)
