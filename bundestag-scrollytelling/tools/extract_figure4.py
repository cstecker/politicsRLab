"""Übernimmt die sechs Balken aus Abb. 4, ohne ihre Höhen zu schätzen."""
import argparse
import hashlib
from io import BytesIO
from pathlib import Path

import fitz
from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artikel", type=Path, help="Verlags-PDF von Elsässer und Wenker")
    pdf = parser.parse_args().artikel
    expected = "823dedd812805ca6b56ddd722bd3dbccc6710ca05be1f14befc6e7b7af00aa50"
    if hashlib.sha256(pdf.read_bytes()).hexdigest() != expected:
        raise ValueError("Die Ausschnitte sind nur für die geprüfte Verlagsfassung definiert.")
    site = Path(__file__).resolve().parents[1] / "site"
    with fitz.open(pdf) as document:
        figure, = document[12].get_images()
        original = Image.open(BytesIO(document.extract_image(figure[0])["image"]))
        if original.size != (1000, 659):
            raise ValueError("Unerwartete Größe der Abbildung auf S. 34.")
        # Beide Felder haben dieselbe Skala. Die Zeilen 465 bis 583
        # entsprechen den Original-Achsenmarken 0,30 bis 0,00.
        for name, left in [("bildung", 82), ("laufbahn", 422)]:
            plot = original.crop((left, 465, left + 228, 584))
            plot.save(site / f"abb4-{name}.png", optimize=True)


if __name__ == "__main__":
    main()
