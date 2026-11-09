import zlib

pure_puml = """@startuml clinica_medical_erd
!theme plain
hide circle
skinparam linetype ortho
skinparam roundcorner 6
skinparam shadowing false
skinparam handwritten false

skinparam classHeaderBackgroundColor #0F766E
skinparam classHeaderFontColor #FFFFFF
skinparam classBorderColor #0F766E
skinparam classBackgroundColor #FFFFFF
skinparam arrowColor #0F766E
skinparam arrowThickness 1.5

title Diagrama Entidad-Relación (ERD) - Base de Datos Clínica Medical

' =============================================================
' DEFINICIÓN DE TODAS LAS ENTIDADES Y ATRIBUTOS (SIN MÓDULOS)
' =============================================================

entity "roles" as roles {
    * id : SERIAL <<PK>>
    --
    * nombre : VARCHAR(50) <<UK>>
    * descripcion : VARCHAR(255)
}

entity "permisos" as permisos {
    * id : SERIAL <<PK>>
    --
    * nombre : VARCHAR(80) <<UK>>
    * modulo : VARCHAR(80)
    descripcion : VARCHAR(255)
}

entity "rol_permiso" as rol_permiso {
    * id : SERIAL <<PK>>
    --
    * rol_id : INTEGER <<FK>>
    * permiso_id : INTEGER <<FK>>
}

entity "usuarios" as usuarios {
    * id : SERIAL <<PK>>
    --
    * rol_id : INTEGER <<FK>>
    * username : VARCHAR(80) <<UK>>
    * correo : VARCHAR(150) <<UK>>
    * password_hash : VARCHAR(255)
    salt : VARCHAR(64)
    * estado : VARCHAR(20)
    ultimo_acceso : TIMESTAMP
    * created_at : TIMESTAMP
    * updated_at : TIMESTAMP
}

entity "tokens_recuperacion" as tokens_recuperacion {
    * id : SERIAL <<PK>>
    --
    * usuario_id : INTEGER <<FK>>
    * token_hash : VARCHAR(255) <<UK>>
    * expira_en : TIMESTAMP
    * usado : BOOLEAN
    * created_at : TIMESTAMP
}

entity "bitacora" as bitacora {
    * id : SERIAL <<PK>>
    --
    usuario_id : INTEGER <<FK>>
    * rol_ejecutor : VARCHAR(50)
    * modulo_afectado : VARCHAR(80)
    * tipo_evento : VARCHAR(60)
    * descripcion_accion : TEXT
    * ip_direccion : VARCHAR(45)
    * fecha_hora : TIMESTAMP
}

entity "pacientes" as pacientes {
    * id : SERIAL <<PK>>
    --
    usuario_id : INTEGER <<FK, UK>>
    * codigo : VARCHAR(20) <<UK>>
    * ci : VARCHAR(20) <<UK>>
    * nombres : VARCHAR(100)
    * apellidos : VARCHAR(100)
    * fecha_nacimiento : DATE
    * sexo : CHAR(1)
    * telefono : VARCHAR(30)
    correo : VARCHAR(150) <<UK>>
    direccion : TEXT
    * estado : VARCHAR(20)
    * created_at : TIMESTAMP
}

entity "antecedentes_medicos" as antecedentes_medicos {
    * id : SERIAL <<PK>>
    --
    * paciente_id : INTEGER <<FK, UK>>
    * grupo_sanguineo : VARCHAR(20)
    * alergias : TEXT
    patologias_cronicas : TEXT
    cirugias_previas : TEXT
    medicacion_habitual : TEXT
    contacto_emergencia_nombre : VARCHAR(100)
    contacto_emergencia_telefono : VARCHAR(30)
    * updated_at : TIMESTAMP
}

entity "especialidades" as especialidades {
    * id : SERIAL <<PK>>
    --
    * codigo : VARCHAR(20) <<UK>>
    * nombre : VARCHAR(100) <<UK>>
    * categoria : VARCHAR(50)
    descripcion : TEXT
    * arancel_consulta : NUMERIC(10,2)
    * estado : VARCHAR(20)
}

entity "consultorios" as consultorios {
    * id : SERIAL <<PK>>
    --
    * numero : VARCHAR(20) <<UK>>
    * piso : VARCHAR(20)
    descripcion : VARCHAR(150)
    equipamiento_especial : TEXT
    * estado : VARCHAR(20)
}

entity "medicos" as medicos {
    * id : SERIAL <<PK>>
    --
    usuario_id : INTEGER <<FK, UK>>
    * codigo : VARCHAR(20) <<UK>>
    * matricula_profesional : VARCHAR(50) <<UK>>
    * nombres : VARCHAR(100)
    * apellidos : VARCHAR(100)
    * telefono : VARCHAR(30)
    * correo : VARCHAR(150) <<UK>>
    * estado_operativo : VARCHAR(20)
}

entity "medico_especialidad" as medico_especialidad {
    * id : SERIAL <<PK>>
    --
    * medico_id : INTEGER <<FK>>
    * especialidad_id : INTEGER <<FK>>
    * activo : BOOLEAN
}

entity "horarios_atencion" as horarios_atencion {
    * id : SERIAL <<PK>>
    --
    * medico_id : INTEGER <<FK>>
    * especialidad_id : INTEGER <<FK>>
    * consultorio_id : INTEGER <<FK>>
    * dia_semana : VARCHAR(15)
    * hora_inicio : TIME
    * hora_fin : TIME
    * duracion_bloque_min : INTEGER
    * estado : VARCHAR(20)
}

entity "ausencias_medicos" as ausencias_medicos {
    * id : SERIAL <<PK>>
    --
    codigo_ausencia : VARCHAR(30) <<UK>>
    * medico_id : INTEGER <<FK>>
    * fecha_inicio : DATE
    * fecha_fin : DATE
    * tipo : VARCHAR(30)
    * motivo : TEXT
    creado_por : VARCHAR(100)
    * created_at : TIMESTAMP
}

entity "citas_medicas" as citas_medicas {
    * id : SERIAL <<PK>>
    --
    * codigo_cita : VARCHAR(20) <<UK>>
    * paciente_id : INTEGER <<FK>>
    * medico_id : INTEGER <<FK>>
    * especialidad_id : INTEGER <<FK>>
    consultorio_id : INTEGER <<FK>>
    * fecha_cita : DATE
    * hora_inicio_bloque : TIME
    * hora_fin_bloque : TIME
    motivo_consulta : TEXT
    * estado_cita : VARCHAR(25)
    motivo_cancelacion : TEXT
    * created_at : TIMESTAMP
    * updated_at : TIMESTAMP
}

entity "pagos_citas" as pagos_citas {
    * id : SERIAL <<PK>>
    --
    * cita_id : INTEGER <<FK, UK>>
    * monto : NUMERIC(10,2)
    * metodo_pago : VARCHAR(40)
    transaccion_pasarela_id : VARCHAR(100) <<UK>>
    * estado_pago : VARCHAR(25)
    * comprobante_oficial_nro : VARCHAR(30) <<UK>>
    * fecha_pago : TIMESTAMP
}

entity "historial_clinico" as historial_clinico {
    * id : SERIAL <<PK>>
    --
    * cita_id : INTEGER <<FK, UK>>
    * paciente_id : INTEGER <<FK>>
    * medico_id : INTEGER <<FK>>
    presion_arterial : VARCHAR(20)
    temperatura_c : NUMERIC(4,1)
    frecuencia_cardiaca : INTEGER
    peso_kg : NUMERIC(5,2)
    talla_cm : NUMERIC(5,2)
    * sintomas : TEXT
    * anamnesis : TEXT
    * diagnostico_principal : TEXT
    * tratamiento_receta : TEXT
    observaciones : TEXT
    * fecha_atencion : TIMESTAMP
}

' =============================================================
' RELACIONES DIRECTAS ENTIDAD - RELACIÓN (CARDINALIDAD CROW'S FOOT)
' =============================================================

roles ||--o{ rol_permiso
permisos ||--o{ rol_permiso
roles ||--o{ usuarios
usuarios ||--o{ tokens_recuperacion
usuarios ||--o| pacientes
usuarios ||--o| medicos
usuarios ||--o{ bitacora

pacientes ||--|| antecedentes_medicos

medicos ||--o{ medico_especialidad
especialidades ||--o{ medico_especialidad
medicos ||--o{ horarios_atencion
especialidades ||--o{ horarios_atencion
consultorios ||--o{ horarios_atencion
medicos ||--o{ ausencias_medicos

pacientes ||--o{ citas_medicas
medicos ||--o{ citas_medicas
especialidades ||--o{ citas_medicas
consultorios |o--o{ citas_medicas

citas_medicas ||--|| pagos_citas
citas_medicas ||--|| historial_clinico
pacientes ||--o{ historial_clinico
medicos ||--o{ historial_clinico

@enduml"""

# Save to workspace root and backend/database
path1 = "/home/andrez/Documentos/SI/MedicalProyect/Medical/database_erd.puml"
path2 = "/home/andrez/Documentos/SI/MedicalProyect/Medical/backend/database/database_erd.puml"
with open(path1, "w", encoding="utf-8") as f:
    f.write(pure_puml)
with open(path2, "w", encoding="utf-8") as f:
    f.write(pure_puml)

# Encode for PlantUML URL
def encode6bit(b):
    if b < 10: return chr(48 + b)
    b -= 10
    if b < 26: return chr(65 + b)
    b -= 26
    if b < 26: return chr(97 + b)
    b -= 26
    if b == 0: return '-'
    if b == 1: return '_'
    return '?'

def append3bytes(b1, b2, b3):
    c1 = b1 >> 2
    c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
    c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
    c4 = b3 & 0x3F
    return encode6bit(c1 & 0x3F) + encode6bit(c2 & 0x3F) + encode6bit(c3 & 0x3F) + encode6bit(c4 & 0x3F)

def encode_plantuml(text):
    zlibbed = zlib.compress(text.encode('utf-8'), 9)
    deflated = zlibbed[2:-4]
    res = []
    i = 0
    while i < len(deflated):
        b1 = deflated[i]
        b2 = deflated[i+1] if i + 1 < len(deflated) else 0
        b3 = deflated[i+2] if i + 2 < len(deflated) else 0
        res.append(append3bytes(b1, b2, b3))
        i += 3
    return ''.join(res)

encoded = encode_plantuml(pure_puml)
print("Saved files successfully.")
print(f"URL: http://www.plantuml.com/plantuml/uml/~1{encoded}")
print(f"PNG: http://www.plantuml.com/plantuml/png/~1{encoded}")
print(f"SVG: http://www.plantuml.com/plantuml/svg/~1{encoded}")
