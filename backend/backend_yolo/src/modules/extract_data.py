from ..data.chords import chords

def extract_all_data(data):
    casas = data.get("casas", {})
    chords_points = {}

    for name, chord in chords.items():
        chord_data = {
            "name": name,
            "pestana": None,
            "positions": []
        }

        if chord.get("pestana", {}).get("active"):
            casa_pestana = chord["pestana"]["casa_start"]
            cordas_pestana = chord["pestana"]["cordas"]
            if all(casa_pestana in casas and corda in casas[casa_pestana] for corda in cordas_pestana):
                start_pt = casas[casa_pestana][cordas_pestana[0]]
                end_pt = casas[casa_pestana][cordas_pestana[-1]]
                mid_idx = len(cordas_pestana) // 2
                middle_pt = casas[casa_pestana][cordas_pestana[mid_idx]]

                chord_data["pestana"] = {
                    "start_point": start_pt,
                    "end_point": end_pt,
                    "text": f"P{chord['pestana'].get('dedo', '')}",
                    "text_position": (middle_pt[0] - 15, middle_pt[1] - 20),
                    "casa": casa_pestana,
                    "cordas": cordas_pestana
                }

        for corda, info in chord.get("position", {}).items():
            casa = info.get("casa", 0)
            dedo = info.get("dedo", 0)
            tocar = info.get("tocar", False)

            if casa == 0 or dedo == 0:
                continue

            if casa in casas and corda in casas[casa]:
                pt = casas[casa][corda]
                chord_data["positions"].append({
                    "point": pt,
                    "text": str(dedo),
                    "text_position": (pt[0]-10, pt[1]+5),
                    "casa": casa,
                    "corda": corda,
                    "tocar": tocar
                })

        chords_points[name] = chord_data

    detection_data = {
        'chords_points': chords_points,
        'axis': data.get('axis'),
        'angle_deg': data.get('angle_deg'),
        'nut': data.get('nut', []),
        'neck_box': data.get('neck_box', []),
        'frets_box': data.get('frets_box', []),
        'pt_projected_final': data.get('pt_projected_final', []),
        'casas': casas,
        'valid': data.get('valid', False)
    }

    return detection_data
