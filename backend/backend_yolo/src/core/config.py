import cv2
from pathlib import Path

class Config:
    _BASE_DIR = Path(__file__).parent.parent.parent
    MODEL_PATH = _BASE_DIR / "runs" / "detect" / "train" / "weights" / "best.onnx"
    IMAGE_PATH = _BASE_DIR / "src" / "data" / "violao.jpg"
    WEBCAM_ID = 0

    VIEW_MODE = {
        '0': None, 
        '1': ['pt_projected_final', 'frets_box', 'nut', 'axis'],
        '2': ['projections', 'expected', 'axis']
    }

    MAX_FRETS = 20
    RMSE_THRESHOLD = 10.0
    SMOOTHING_ALFA = 0.6