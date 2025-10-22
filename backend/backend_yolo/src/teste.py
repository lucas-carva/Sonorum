import cv2
from ultralytics import YOLO
from core.config import Config
from core.state_manager import StateManager
from services.detection_pipeline import DetectionPipeline
from modules.extract_data import extract_all_data
from modules.draw_boxes import draw, draw_chords
from data.chords import chords 


def main():
    model = YOLO(Config.MODEL_PATH)
    state = StateManager()
    pipeline = DetectionPipeline(model, state)

    cap = cv2.VideoCapture(Config.WEBCAM_ID)
    placeholder = cv2.imread(Config.IMAGE_PATH)

    current_frame = placeholder.copy() if placeholder is not None else None

    display_mode = 1
    allowed_classes = None
    current_chord = None

    if current_frame is None:
        print("Placeholder nao foi carregado")
        return

    while True:
        ret, webcam_frame = cap.read()
        frame = webcam_frame if ret else current_frame.copy()

        pipeline_data = pipeline.process_frame(frame)
        data = extract_all_data(pipeline_data)

        if display_mode == 0:
            display_frame = draw(data, frame, allowed_classes)
        elif display_mode == 1:
            if data.get('casas') and 1 in data['casas']:
                display_frame = draw_chords(data, frame, current_chord)
            else:
                display_frame = frame.copy()


        cv2.imshow("Chord", display_frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif chr(key) in Config.VIEW_MODE: 
            allowed_classes = Config.VIEW_MODE[chr(key)]
        elif key == ord('a'):
            current_chord = 'A_MAJOR'
        elif key == ord('b'):
            current_chord = 'B_MAJOR'
        elif key == ord('c'):
            current_chord = 'C_MAJOR'
        elif key == ord('d'):
            current_chord = 'D_MAJOR'
        elif key == ord('e'):
            current_chord = 'E_MAJOR'
        elif key == ord('f'):
            current_chord = 'F_MAJOR'
        elif key == ord('g'):
            current_chord = 'G_MAJOR'

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()