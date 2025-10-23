import cv2 

def draw(data, frame, allowed_classes):
    if allowed_classes is None or "frets_box" in allowed_classes:
        frets_box = data.get('frets_box', [])
        for (pt1, pt2, conf) in frets_box:
            x1, y1 = pt1
            x2, y2 = pt2
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

    if allowed_classes is None or "nut" in allowed_classes:
        nut = data.get('nut', [])
        for (cx, cy, conf) in nut:
            cv2.circle(frame, (cx, cy), 5, (255, 0, 0), 2)

    if allowed_classes is None or "neck" in allowed_classes:
        neck_box = data.get('neck_box', [])
        for (pt1, pt2, conf) in neck_box:
            x1, y1 = pt1
            x2, y2 = pt2
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)

    valid = data.get('valid', False)
    if valid:
        if allowed_classes is None or "axis" in allowed_classes:
            axis_data = data.get('axis')
            if axis_data:
                start, end = axis_data
                cv2.line(frame, start, end, (0, 255, 255), 2)
        
        if allowed_classes is None or "pt_projected_final" in allowed_classes:
            pt_projected_final = data.get('pt_projected_final', [])
            for p in pt_projected_final:
                pt = p.get('pt')
                if pt:
                    cv2.circle(frame, pt, 3, (255, 0, 0), -1)

    return frame

def draw_chords(data, frame, chord_name):
  
    chords_points = data.get('chords_points', {})

    
    if chord_name not in chords_points:
        return frame
    
    chord_data = chords_points[chord_name]

    if chord_data.get('pestana'):
        pestana = chord_data['pestana']
        cv2.line(frame, pestana['start_point'], pestana['end_point'], (0, 255, 255), 3)
        cv2.putText(frame, pestana['text'], 
                   pestana['text_position'],
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
    
    positions = chord_data.get('positions', [])
    
    for i, position in enumerate(positions):
        cv2.circle(frame, position['point'], 4, (255, 0, 0), -1)
        cv2.putText(frame, position['text'], 
                   position['text_position'],
                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 2)
    
    return frame