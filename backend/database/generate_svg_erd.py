import os

def generate_svg():
    # Tables definition with attributes: (name, is_pk, is_fk, is_uk, type)
    tables = {
        # Modulo Seguridad
        "roles": {
            "title": "roles", "mod": "SEGURIDAD", "x": 60, "y": 120, "w": 250,
            "attrs": [("id", True, False, False, "SERIAL"), ("nombre", False, False, True, "VARCHAR(50)"), ("descripcion", False, False, False, "VARCHAR(255)")]
        },
        "permisos": {
            "title": "permisos", "mod": "SEGURIDAD", "x": 370, "y": 120, "w": 250,
            "attrs": [("id", True, False, False, "SERIAL"), ("nombre", False, False, True, "VARCHAR(80)"), ("modulo", False, False, False, "VARCHAR(80)"), ("descripcion", False, False, False, "VARCHAR(255)")]
        },
        "rol_permiso": {
            "title": "rol_permiso", "mod": "SEGURIDAD", "x": 215, "y": 270, "w": 250,
            "attrs": [("id", True, False, False, "SERIAL"), ("rol_id", False, True, False, "INTEGER"), ("permiso_id", False, True, False, "INTEGER")]
        },
        "usuarios": {
            "title": "usuarios", "mod": "SEGURIDAD", "x": 60, "y": 400, "w": 270,
            "attrs": [("id", True, False, False, "SERIAL"), ("rol_id", False, True, False, "INTEGER"), ("username", False, False, True, "VARCHAR(80)"), ("correo", False, False, True, "VARCHAR(150)"), ("password_hash", False, False, False, "VARCHAR(255)"), ("estado", False, False, False, "VARCHAR(20)"), ("created_at", False, False, False, "TIMESTAMP")]
        },
        "tokens_recuperacion": {
            "title": "tokens_recuperacion", "mod": "SEGURIDAD", "x": 60, "y": 620, "w": 270,
            "attrs": [("id", True, False, False, "SERIAL"), ("usuario_id", False, True, False, "INTEGER"), ("token_hash", False, False, True, "VARCHAR(255)"), ("expira_en", False, False, False, "TIMESTAMP"), ("usado", False, False, False, "BOOLEAN")]
        },
        "bitacora": {
            "title": "bitacora", "mod": "SEGURIDAD", "x": 60, "y": 780, "w": 270,
            "attrs": [("id", True, False, False, "SERIAL"), ("usuario_id", False, True, False, "INTEGER"), ("rol_ejecutor", False, False, False, "VARCHAR(50)"), ("modulo_afectado", False, False, False, "VARCHAR(80)"), ("tipo_evento", False, False, False, "VARCHAR(60)"), ("fecha_hora", False, False, False, "TIMESTAMP")]
        },

        # Modulo Pacientes
        "pacientes": {
            "title": "pacientes", "mod": "PACIENTES", "x": 420, "y": 420, "w": 270,
            "attrs": [("id", True, False, False, "SERIAL"), ("usuario_id", False, True, True, "INTEGER"), ("codigo", False, False, True, "VARCHAR(20)"), ("ci", False, False, True, "VARCHAR(20)"), ("nombres", False, False, False, "VARCHAR(100)"), ("apellidos", False, False, False, "VARCHAR(100)"), ("telefono", False, False, False, "VARCHAR(30)"), ("correo", False, False, True, "VARCHAR(150)"), ("estado", False, False, False, "VARCHAR(20)")]
        },
        "antecedentes_medicos": {
            "title": "antecedentes_medicos", "mod": "PACIENTES", "x": 420, "y": 680, "w": 270,
            "attrs": [("id", True, False, False, "SERIAL"), ("paciente_id", False, True, True, "INTEGER"), ("grupo_sanguineo", False, False, False, "VARCHAR(20)"), ("alergias", False, False, False, "TEXT"), ("patologias_cronicas", False, False, False, "TEXT"), ("contacto_emergencia_nombre", False, False, False, "VARCHAR(100)"), ("contacto_emergencia_telefono", False, False, False, "VARCHAR(30)")]
        },

        # Modulo Medicos & Especialidades
        "especialidades": {
            "title": "especialidades", "mod": "MEDICOS", "x": 750, "y": 120, "w": 260,
            "attrs": [("id", True, False, False, "SERIAL"), ("codigo", False, False, True, "VARCHAR(20)"), ("nombre", False, False, True, "VARCHAR(100)"), ("arancel_consulta", False, False, False, "NUMERIC(10,2)"), ("estado", False, False, False, "VARCHAR(20)")]
        },
        "consultorios": {
            "title": "consultorios", "mod": "MEDICOS", "x": 1070, "y": 120, "w": 240,
            "attrs": [("id", True, False, False, "SERIAL"), ("numero", False, False, True, "VARCHAR(20)"), ("piso", False, False, False, "VARCHAR(20)"), ("descripcion", False, False, False, "VARCHAR(150)"), ("estado", False, False, False, "VARCHAR(20)")]
        },
        "medicos": {
            "title": "medicos", "mod": "MEDICOS", "x": 750, "y": 300, "w": 270,
            "attrs": [("id", True, False, False, "SERIAL"), ("usuario_id", False, True, True, "INTEGER"), ("codigo", False, False, True, "VARCHAR(20)"), ("matricula_profesional", False, False, True, "VARCHAR(50)"), ("nombres", False, False, False, "VARCHAR(100)"), ("apellidos", False, False, False, "VARCHAR(100)"), ("telefono", False, False, False, "VARCHAR(30)"), ("correo", False, False, True, "VARCHAR(150)"), ("estado_operativo", False, False, False, "VARCHAR(20)")]
        },
        "medico_especialidad": {
            "title": "medico_especialidad", "mod": "MEDICOS", "x": 1070, "y": 300, "w": 250,
            "attrs": [("id", True, False, False, "SERIAL"), ("medico_id", False, True, False, "INTEGER"), ("especialidad_id", False, True, False, "INTEGER"), ("activo", False, False, False, "BOOLEAN")]
        },
        "horarios_atencion": {
            "title": "horarios_atencion", "mod": "MEDICOS", "x": 1070, "y": 440, "w": 250,
            "attrs": [("id", True, False, False, "SERIAL"), ("medico_id", False, True, False, "INTEGER"), ("especialidad_id", False, True, False, "INTEGER"), ("consultorio_id", False, True, False, "INTEGER"), ("dia_semana", False, False, False, "VARCHAR(15)"), ("hora_inicio", False, False, False, "TIME"), ("hora_fin", False, False, False, "TIME"), ("duracion_bloque_min", False, False, False, "INTEGER")]
        },
        "ausencias_medicos": {
            "title": "ausencias_medicos", "mod": "MEDICOS", "x": 750, "y": 570, "w": 270,
            "attrs": [("id", True, False, False, "SERIAL"), ("medico_id", False, True, False, "INTEGER"), ("codigo_ausencia", False, False, True, "VARCHAR(30)"), ("fecha_inicio", False, False, False, "DATE"), ("fecha_fin", False, False, False, "DATE"), ("tipo", False, False, False, "VARCHAR(30)"), ("motivo", False, False, False, "TEXT")]
        },

        # Modulo Transaccional
        "citas_medicas": {
            "title": "citas_medicas", "mod": "TRANSACCIONAL", "x": 1390, "y": 280, "w": 290,
            "attrs": [("id", True, False, False, "SERIAL"), ("codigo_cita", False, False, True, "VARCHAR(20)"), ("paciente_id", False, True, False, "INTEGER"), ("medico_id", False, True, False, "INTEGER"), ("especialidad_id", False, True, False, "INTEGER"), ("consultorio_id", False, True, False, "INTEGER"), ("fecha_cita", False, False, False, "DATE"), ("hora_inicio_bloque", False, False, False, "TIME"), ("hora_fin_bloque", False, False, False, "TIME"), ("motivo_consulta", False, False, False, "TEXT"), ("estado_cita", False, False, False, "VARCHAR(25)")]
        },
        "pagos_citas": {
            "title": "pagos_citas", "mod": "TRANSACCIONAL", "x": 1390, "y": 590, "w": 290,
            "attrs": [("id", True, False, False, "SERIAL"), ("cita_id", False, True, True, "INTEGER"), ("monto", False, False, False, "NUMERIC(10,2)"), ("metodo_pago", False, False, False, "VARCHAR(40)"), ("transaccion_pasarela_id", False, False, True, "VARCHAR(100)"), ("estado_pago", False, False, False, "VARCHAR(25)"), ("comprobante_oficial_nro", False, False, True, "VARCHAR(30)"), ("fecha_pago", False, False, False, "TIMESTAMP")]
        },
        "historial_clinico": {
            "title": "historial_clinico", "mod": "TRANSACCIONAL", "x": 1070, "y": 680, "w": 280,
            "attrs": [("id", True, False, False, "SERIAL"), ("cita_id", False, True, True, "INTEGER"), ("paciente_id", False, True, False, "INTEGER"), ("medico_id", False, True, False, "INTEGER"), ("presion_arterial", False, False, False, "VARCHAR(20)"), ("temperatura_c", False, False, False, "NUMERIC(4,1)"), ("sintomas", False, False, False, "TEXT"), ("diagnostico_principal", False, False, False, "TEXT"), ("tratamiento_receta", False, False, False, "TEXT"), ("fecha_atencion", False, False, False, "TIMESTAMP")]
        }
    }

    # Color palettes by module
    module_colors = {
        "SEGURIDAD": {"header": "#0f766e", "border": "#14b8a6", "bg": "#f0fdfa"},
        "PACIENTES": {"header": "#15803d", "border": "#22c55e", "bg": "#f0fdf4"},
        "MEDICOS": {"header": "#b45309", "border": "#f59e0b", "bg": "#fffbeb"},
        "TRANSACCIONAL": {"header": "#1d4ed8", "border": "#3b82f6", "bg": "#eff6ff"}
    }

    # SVG canvas size
    width = 1750
    height = 980

    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" style="background-color: #f8fafc; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">')
    
    # Definitions for markers and filters
    svg.append('''<defs>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
        <feOffset dx="0" dy="4"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.08"/></feComponentTransfer>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
      </marker>
      <marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5">
        <circle cx="5" cy="5" r="3" fill="#0f766e" />
      </marker>
    </defs>''')

    # Top Header
    svg.append('''<rect x="30" y="20" width="1690" height="70" rx="16" fill="#0f172a" />
    <text x="60" y="52" fill="#ffffff" font-size="20" font-weight="900" letter-spacing="0.5">DIAGRAMA ENTIDAD - RELACIÓN (ERD) • CLÍNICA MEDICAL</text>
    <text x="60" y="73" fill="#94a3b8" font-size="12" font-weight="500">PostgreSQL 16 • 17 Tablas • 22 Relaciones con Integridad Referencial • Generado Oficialmente</text>
    <rect x="1460" y="38" width="230" height="34" rx="8" fill="#1e293b" />
    <text x="1575" y="60" fill="#38bdf8" font-size="12" font-weight="700" text-anchor="middle">SISTEMA MÉDICO COMPLETO</text>''')

    # Relationships definition: (source, target, label, color)
    relationships = [
        ("roles", "rol_permiso", "1:N", "#0f766e"),
        ("permisos", "rol_permiso", "1:N", "#0f766e"),
        ("roles", "usuarios", "1:N", "#0f766e"),
        ("usuarios", "tokens_recuperacion", "1:N", "#0f766e"),
        ("usuarios", "bitacora", "1:N", "#0f766e"),
        ("usuarios", "pacientes", "1:0..1", "#0284c7"),
        ("usuarios", "medicos", "1:0..1", "#0284c7"),
        ("pacientes", "antecedentes_medicos", "1:1", "#15803d"),
        ("medicos", "medico_especialidad", "1:N", "#b45309"),
        ("especialidades", "medico_especialidad", "1:N", "#b45309"),
        ("medicos", "horarios_atencion", "1:N", "#b45309"),
        ("especialidades", "horarios_atencion", "1:N", "#b45309"),
        ("consultorios", "horarios_atencion", "1:N", "#b45309"),
        ("medicos", "ausencias_medicos", "1:N", "#b45309"),
        ("pacientes", "citas_medicas", "1:N", "#1d4ed8"),
        ("medicos", "citas_medicas", "1:N", "#1d4ed8"),
        ("especialidades", "citas_medicas", "1:N", "#1d4ed8"),
        ("citas_medicas", "pagos_citas", "1:1", "#1d4ed8"),
        ("citas_medicas", "historial_clinico", "1:1", "#1d4ed8"),
        ("pacientes", "historial_clinico", "1:N", "#15803d"),
        ("medicos", "historial_clinico", "1:N", "#b45309")
    ]

    # Draw relationship connector lines first (under cards)
    for src, tgt, label, col in relationships:
        if src in tables and tgt in tables:
            s = tables[src]
            t = tables[tgt]
            sx = s["x"] + s["w"] / 2
            sy = s["y"] + 20
            tx = t["x"] + t["w"] / 2
            ty = t["y"] + 20
            
            # Simple bezier control
            dx = tx - sx
            dy = ty - sy
            cx1 = sx + dx * 0.3
            cy1 = sy + dy * 0.1
            cx2 = sx + dx * 0.7
            cy2 = sy + dy * 0.9

            svg.append(f'<path d="M {sx} {sy} C {cx1} {cy1}, {cx2} {cy2}, {tx} {ty}" fill="none" stroke="{col}" stroke-width="1.8" stroke-dasharray="4,3" opacity="0.65" marker-end="url(#arrow)" />')

    # Draw Tables (Entities)
    for t_id, info in tables.items():
        x = info["x"]
        y = info["y"]
        w = info["w"]
        attrs = info["attrs"]
        colors = module_colors[info["mod"]]
        header_h = 32
        row_h = 20
        total_h = header_h + len(attrs) * row_h + 8

        # Background card with shadow
        svg.append(f'<g id="table-{t_id}" filter="url(#shadow)">')
        svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{total_h}" rx="10" fill="#ffffff" stroke="{colors["border"]}" stroke-width="1.5" />')
        
        # Header rect
        svg.append(f'<path d="M {x} {y+10} A 10 10 0 0 1 {x+10} {y} L {x+w-10} {y} A 10 10 0 0 1 {x+w} {y+10} L {x+w} {y+header_h} L {x} {y+header_h} Z" fill="{colors["header"]}" />')
        svg.append(f'<text x="{x+12}" y="{y+21}" fill="#ffffff" font-size="13" font-weight="800">{info["title"]}</text>')
        svg.append(f'<rect x="{x+w-54}" y="{y+7}" width="44" height="18" rx="9" fill="rgba(255,255,255,0.2)" />')
        svg.append(f'<text x="{x+w-32}" y="{y+19}" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">{len(attrs)} cols</text>')

        # Attributes list
        cur_y = y + header_h + 16
        for name, is_pk, is_fk, is_uk, dtype in attrs:
            # Badges
            badge_x = x + 10
            if is_pk:
                svg.append(f'<rect x="{badge_x}" y="{cur_y-11}" width="20" height="13" rx="3" fill="#fef08a" stroke="#eab308" stroke-width="0.7"/>')
                svg.append(f'<text x="{badge_x+10}" y="{cur_y-1}" fill="#854d0e" font-size="8" font-weight="900" text-anchor="middle">PK</text>')
                badge_x += 24
            if is_fk:
                svg.append(f'<rect x="{badge_x}" y="{cur_y-11}" width="20" height="13" rx="3" fill="#bae6fd" stroke="#0284c7" stroke-width="0.7"/>')
                svg.append(f'<text x="{badge_x+10}" y="{cur_y-1}" fill="#0369a1" font-size="8" font-weight="900" text-anchor="middle">FK</text>')
                badge_x += 24
            if is_uk:
                svg.append(f'<rect x="{badge_x}" y="{cur_y-11}" width="20" height="13" rx="3" fill="#fed7aa" stroke="#ea580c" stroke-width="0.7"/>')
                svg.append(f'<text x="{badge_x+10}" y="{cur_y-1}" fill="#9a3412" font-size="8" font-weight="900" text-anchor="middle">UK</text>')
                badge_x += 24

            # Field name and data type
            svg.append(f'<text x="{badge_x+4}" y="{cur_y}" fill="#0f172a" font-size="11" font-weight="600" font-family="monospace">{name}</text>')
            svg.append(f'<text x="{x+w-10}" y="{cur_y}" fill="#64748b" font-size="9" font-weight="500" font-family="monospace" text-anchor="end">{dtype}</text>')
            cur_y += row_h

        svg.append('</g>')

    svg.append('</svg>')
    
    content = "\n".join(svg)
    out1 = "/home/andrez/Documentos/SI/MedicalProyect/Medical/clinica_medical_erd.svg"
    out2 = "/home/andrez/Documentos/SI/MedicalProyect/Medical/backend/database/clinica_medical_erd.svg"
    with open(out1, "w", encoding="utf-8") as f:
        f.write(content)
    with open(out2, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"SVG generated successfully: {out1} ({os.path.getsize(out1)} bytes)")

generate_svg()
