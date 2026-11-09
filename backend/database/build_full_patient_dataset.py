import json
import os
import hashlib
import re

# Hash function matching authService.ts
def hash_password(password, salt=None):
    if not salt:
        salt = os.urandom(16).hex()
    h = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt.encode('utf-8'), 10000, 64).hex()
    return {"hash": h, "salt": salt}

default_patient_pass = hash_password("Paciente123!", "paciente_salt_2026")

# Load existing initialData.ts to preserve specialties, doctors, schedules, absences, services
with open("/home/andrez/Documentos/SI/MedicalProyect/Medical/backend/database/populate_20_patients.py", "r", encoding="utf-8") as f:
    text = f.read()

# Extract patients_data list
loc = {}
exec(text, {}, loc)
patients_data = loc["patients_data"]

# Generate extensive previous and current appointments for all 20 patients
# Mapping of specialties and doctors:
# doc-001: esp-cardio (Dr. Carlos Mendoza)
# doc-002: esp-derma (Dra. Elena Vargas)
# doc-003: esp-medgen (Dr. Juan Pérez)
# doc-004: esp-pedia (Dra. Gabriela Castro)
# doc-005: esp-gineco (Dra. Sofía Morales)
# doc-006: esp-trauma (Dr. Roberto Siles)
# doc-007: esp-oftalmo (Dr. Marcelo Ortiz)
# doc-008: esp-uro (Dr. Fernando Rocha)
# doc-009: esp-endo (Dra. Patricia Arze)
# doc-010: esp-gastro (Dr. Andrés Beltrán)
# doc-011: esp-neumo (Dr. Hugo Céspedes)
# doc-012: esp-neuro (Dra. Mariana Suárez)
# doc-013: esp-orl (Dr. Rodrigo Navia)
# doc-014: esp-fisio (Lic. Claudia Torrico)
# doc-015: esp-fono (Lic. Verónica Landívar)
# doc-016: esp-psico (Lic. Daniela Antelo)
# doc-017: esp-psiquia (Dr. Guillermo Hurtado)
# doc-018: esp-reuma (Dra. Roxana Pinto)
# doc-019: esp-medvasc (Dr. Alejandro Vaca)

appointments_data = [
    # PAC-001 (María López)
    {
        "id": "appt-001", "code": "CM-0001", "patientId": "pac-001", "doctorId": "doc-003", "specialtyId": "esp-medgen",
        "date": "2026-11-16", "timeSlot": "09:00 - 09:15", "startTime": "09:00", "endTime": "09:15",
        "reason": "Consulta general y control de rutina", "status": "Programada",
        "createdAt": "2026-10-20T08:00:00Z", "updatedAt": "2026-10-20T08:00:00Z"
    },
    {
        "id": "appt-006", "code": "CM-0006", "patientId": "pac-001", "doctorId": "doc-005", "specialtyId": "esp-gineco",
        "date": "2026-10-15", "timeSlot": "09:00 - 09:15", "startTime": "09:00", "endTime": "09:15",
        "reason": "Control ginecológico anual y toma de citología cervical (PAP)", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "115/75", "temperatureC": 36.4, "heartRate": 68, "weightKg": 58.0, "heightCm": 162},
        "clinicalNotes": "Diagnóstico: Control ginecológico preventivo y citología cervical de rutina. Ectocérvix sano sin lesiones.\nTratamiento / Receta:\n1. Ácido fólico 5mg: 1 comprimido al día por 30 días.\n2. Vitamina D3 2000 UI diarias con el desayuno.\n3. Resultado de PAP programado para retiro en 10 días hábiles.",
        "createdAt": "2026-10-01T10:00:00Z", "updatedAt": "2026-10-15T09:35:00Z"
    },
    {
        "id": "appt-010", "code": "CM-0010", "patientId": "pac-001", "doctorId": "doc-013", "specialtyId": "esp-orl",
        "date": "2026-06-20", "timeSlot": "15:30 - 15:45", "startTime": "15:30", "endTime": "15:45",
        "reason": "Crisis de rinitis alérgica severa, prurito nasal y rinorrea hialina", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "118/76", "temperatureC": 36.5, "heartRate": 72, "weightKg": 57.5, "heightCm": 162},
        "clinicalNotes": "Diagnóstico: Rinitis alérgica perenne agudizada. Cornetes inferiores hipertróficos y pálidos.\nTratamiento / Receta:\n1. Mometasona spray nasal 50mcg: 2 aplicaciones en cada fosa nasal cada 24h por 30 días.\n2. Levocetirizina 5mg: 1 comprimido noche por 14 días.\n3. Lavados con solución fisiológica al 0.9% 3 veces al día.",
        "createdAt": "2026-06-18T09:00:00Z", "updatedAt": "2026-06-20T16:00:00Z"
    },

    # PAC-002 (Carlos Fernández)
    {
        "id": "appt-002", "code": "CM-0002", "patientId": "pac-002", "doctorId": "doc-001", "specialtyId": "esp-cardio",
        "date": "2026-11-16", "timeSlot": "08:30 - 08:45", "startTime": "08:30", "endTime": "08:45",
        "reason": "Control de hipertensión y valoración de nuevo tratamiento", "status": "Confirmada",
        "createdAt": "2026-10-20T08:15:00Z", "updatedAt": "2026-10-20T08:20:00Z"
    },
    {
        "id": "appt-007", "code": "CM-0007", "patientId": "pac-002", "doctorId": "doc-003", "specialtyId": "esp-medgen",
        "date": "2026-10-10", "timeSlot": "10:00 - 10:15", "startTime": "10:00", "endTime": "10:15",
        "reason": "Cuadro respiratorio agudo y cefalea pulsátil occipital", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "145/95", "temperatureC": 37.8, "heartRate": 86, "weightKg": 82.5, "heightCm": 174},
        "clinicalNotes": "Diagnóstico: Faringitis viral aguda + Cifras tensionales elevadas (Presunta HTA).\nTratamiento / Receta:\n1. Paracetamol 500mg: 1 comp cada 8h por 4 días si hay dolor/fiebre.\n2. Losartán 50mg: 1 comp cada mañana.\n3. DERIVACIÓN PRIORITARIA A CARDIOLOGÍA para Holter MAPA 24h.",
        "createdAt": "2026-10-08T11:00:00Z", "updatedAt": "2026-10-10T10:25:00Z"
    },
    {
        "id": "appt-009", "code": "CM-0009", "patientId": "pac-002", "doctorId": "doc-009", "specialtyId": "esp-endo",
        "date": "2026-10-24", "timeSlot": "11:00 - 11:15", "startTime": "11:00", "endTime": "11:15",
        "reason": "Evaluación metabólica por glucemia elevada y sobrepeso", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "138/88", "temperatureC": 36.6, "heartRate": 74, "weightKg": 82.0, "heightCm": 174},
        "clinicalNotes": "Diagnóstico: Prediabetes (Glucemia en ayunas 116 mg/dL) + Dislipidemia mixta.\nTratamiento / Receta:\n1. Metformina 850mg con el almuerzo.\n2. Atorvastatina 10mg nocturna.\n3. Dieta mediterránea hipocalórica y ejercicio aeróbico 150 min/semana.",
        "createdAt": "2026-10-20T09:00:00Z", "updatedAt": "2026-10-24T11:30:00Z"
    },

    # PAC-003 (Andrea Montaño)
    {
        "id": "appt-003", "code": "CM-0003", "patientId": "pac-003", "doctorId": "doc-002", "specialtyId": "esp-derma",
        "date": "2026-11-17", "timeSlot": "09:30 - 09:45", "startTime": "09:30", "endTime": "09:45",
        "reason": "Revisión dermatoscópica de lunares en espalda", "status": "Programada",
        "createdAt": "2026-10-20T08:30:00Z", "updatedAt": "2026-10-20T08:30:00Z"
    },
    {
        "id": "appt-011", "code": "CM-0011", "patientId": "pac-003", "doctorId": "doc-012", "specialtyId": "esp-neuro",
        "date": "2026-09-14", "timeSlot": "14:30 - 14:45", "startTime": "14:30", "endTime": "14:45",
        "reason": "Crisis migrañosa refractaria con escotoma centelleante de 48h de evolución", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "110/70", "temperatureC": 36.6, "heartRate": 64, "weightKg": 54.0, "heightCm": 165},
        "clinicalNotes": "Diagnóstico: Estado migrañoso con aura visual típica. Examen neurológico sin signos focales meníngeos.\nTratamiento / Receta:\n1. Sumatriptán 50mg VO rescate (máx 2 comp/24h).\n2. Propranolol 40mg cada 12h profilaxis continua.\n3. Diario de cefaleas y control de factores desencadenantes (luces estroboscópicas, chocolate).",
        "createdAt": "2026-09-12T10:00:00Z", "updatedAt": "2026-09-14T15:10:00Z"
    },
    {
        "id": "appt-012", "code": "CM-0012", "patientId": "pac-003", "doctorId": "doc-007", "specialtyId": "esp-oftalmo",
        "date": "2026-07-28", "timeSlot": "10:00 - 10:15", "startTime": "10:00", "endTime": "10:15",
        "reason": "Fondo de ojo por visión borrosa periaura y refracción ocular", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "112/72", "temperatureC": 36.5, "heartRate": 68, "weightKg": 54.2, "heightCm": 165},
        "clinicalNotes": "Diagnóstico: Astigmatismo miópico compuesto OD -2.50 -0.75x180°, OI -2.25 -0.50x175°. Fondo de ojo: papila de bordes netos, sin edema ni exudados.\nTratamiento / Receta:\n1. Nueva graduación en cristales antirreflejo y filtro luz azul.\n2. Lágrimas artificiales 1 gota cada 6h por ojo seco evaporativo.",
        "createdAt": "2026-07-25T11:00:00Z", "updatedAt": "2026-07-28T10:30:00Z"
    },

    # PAC-004 (Mateo Gutiérrez)
    {
        "id": "appt-004", "code": "CM-0004", "patientId": "pac-004", "doctorId": "doc-004", "specialtyId": "esp-pedia",
        "date": "2026-11-16", "timeSlot": "14:30 - 14:45", "startTime": "14:30", "endTime": "14:45",
        "reason": "Control de crecimiento pediátrico y brote atópico", "status": "Confirmada",
        "createdAt": "2026-10-20T08:45:00Z", "updatedAt": "2026-10-20T08:45:00Z"
    },
    {
        "id": "appt-013", "code": "CM-0013", "patientId": "pac-004", "doctorId": "doc-004", "specialtyId": "esp-pedia",
        "date": "2026-08-10", "timeSlot": "15:00 - 15:15", "startTime": "15:00", "endTime": "15:15",
        "reason": "Tos nocturna espasmódica y sibilancias bilaterales audibles", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "95/60", "temperatureC": 36.8, "heartRate": 98, "weightKg": 21.5, "heightCm": 115},
        "clinicalNotes": "Diagnóstico: Broncoespasmo agudo en paciente con hiperreactividad bronquial (Asma infantil).\nTratamiento / Receta:\n1. Salbutamol 100mcg aerosol: 2 puff con aerocámara cada 4h por 3 días, luego cada 6h por 2 días.\n2. Budesonida 200mcg aerosol: 1 puff cada 12h como controlador de mantenimiento por 3 meses.\n3. Baños cortos con agua tibia y jabón sobreengrasado para su dermatitis.",
        "createdAt": "2026-08-09T08:00:00Z", "updatedAt": "2026-08-10T15:30:00Z"
    },

    # PAC-005 (Roberto Villarroel)
    {
        "id": "appt-005", "code": "CM-0005", "patientId": "pac-005", "doctorId": "doc-009", "specialtyId": "esp-endo",
        "date": "2026-11-16", "timeSlot": "09:30 - 09:45", "startTime": "09:30", "endTime": "09:45",
        "reason": "Ajuste de dosis de hipoglucemiantes y perfil tiroideo", "status": "Programada",
        "createdAt": "2026-10-20T09:00:00Z", "updatedAt": "2026-10-20T09:00:00Z"
    },
    {
        "id": "appt-014", "code": "CM-0014", "patientId": "pac-005", "doctorId": "doc-008", "specialtyId": "esp-uro",
        "date": "2026-09-02", "timeSlot": "15:30 - 15:45", "startTime": "15:30", "endTime": "15:45",
        "reason": "Nicturia (3-4 veces/noche), chorro miccional débil y pujo vesical", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "135/85", "temperatureC": 36.7, "heartRate": 70, "weightKg": 79.5, "heightCm": 168},
        "clinicalNotes": "Diagnóstico: Hiperplasia Prostática Benigna sintomática (IPSS 18 - Moderado). PSA total 1.8 ng/mL.\nTratamiento / Receta:\n1. Tamsulosina 0.4mg: 1 cápsula 30 min después de la cena de forma continua.\n2. Finasterida 5mg: 1 comp diario matutino para reducción de volumen prostático.\n3. Restricción de líquidos pasadas las 19:00 hrs y control ecográfico en 6 meses.",
        "createdAt": "2026-08-28T10:00:00Z", "updatedAt": "2026-09-02T16:00:00Z"
    },
    {
        "id": "appt-015", "code": "CM-0015", "patientId": "pac-005", "doctorId": "doc-009", "specialtyId": "esp-endo",
        "date": "2026-05-18", "timeSlot": "10:30 - 10:45", "startTime": "10:30", "endTime": "10:45",
        "reason": "Control semestral de HbA1c y microalbuminuria", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "130/82", "temperatureC": 36.5, "heartRate": 72, "weightKg": 80.2, "heightCm": 168},
        "clinicalNotes": "Diagnóstico: Diabetes Mellitus tipo 2 en rango meta subóptimo (HbA1c 7.6%). Sin microalbuminuria.\nTratamiento / Receta:\n1. Metformina 850mg: Aumentar a 1 comprimido con desayuno y 1 con cena.\n2. Empagliflozina 10mg: 1 comp matutino (beneficio cardiorrenal demostrado).\n3. Inspección diaria minuciosa de pies y calzado terapéutico sin costuras.",
        "createdAt": "2026-05-15T09:00:00Z", "updatedAt": "2026-05-18T11:15:00Z"
    },

    # PAC-006 (Lucía Morales Céspedes)
    {
        "id": "appt-016", "code": "CM-0016", "patientId": "pac-006", "doctorId": "doc-018", "specialtyId": "esp-reuma",
        "date": "2026-10-16", "timeSlot": "08:30 - 08:45", "startTime": "08:30", "endTime": "08:45",
        "reason": "Evaluación de artritis reumatoide, dolor en carpos e interfalángicas proximales", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "120/75", "temperatureC": 36.6, "heartRate": 76, "weightKg": 63.0, "heightCm": 160},
        "clinicalNotes": "Diagnóstico: Artritis Reumatoide activa (DAS28 3.8 - Actividad moderada). Sinovitis palpable en 2da y 3ra MCF bilaterales.\nTratamiento / Receta:\n1. Metotrexato 15mg VO semanal (los lunes).\n2. Ácido Fólico 5mg VO los martes (24h después del MTX).\n3. Prednisona 5mg matutina de rescate por 15 días.\n4. Hemograma, GOT/GPT y creatinina de control en 4 semanas.",
        "createdAt": "2026-10-12T08:00:00Z", "updatedAt": "2026-10-16T09:05:00Z"
    },
    {
        "id": "appt-017", "code": "CM-0017", "patientId": "pac-006", "doctorId": "doc-014", "specialtyId": "esp-fisio",
        "date": "2026-10-21", "timeSlot": "08:00 - 08:45", "startTime": "08:00", "endTime": "08:45",
        "reason": "Plan de rehabilitación motora articular y fortalecimiento de flexo-extensores de muñeca", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "118/74", "temperatureC": 36.4, "heartRate": 70, "weightKg": 63.2, "heightCm": 160},
        "clinicalNotes": "Diagnóstico: Rigidez articular matutina e hipotonía de interóseos palmares.\nTratamiento:\n1. Termoterapia con compresas húmedo-calientes por 15 min.\n2. Ultrasonido pulsátil 1 MHz a 1.2 W/cm2 en ambas muñecas.\n3. Cinesiterapia activa asistida y ejercicios de pinza fina con plastilina terapéutica.\n4. Se pautan 10 sesiones consecutivas.",
        "createdAt": "2026-10-18T10:00:00Z", "updatedAt": "2026-10-21T09:00:00Z"
    },

    # PAC-007 (Fernando Vaca Justiniano)
    {
        "id": "appt-018", "code": "CM-0018", "patientId": "pac-007", "doctorId": "doc-010", "specialtyId": "esp-gastro",
        "date": "2026-09-15", "timeSlot": "08:30 - 08:45", "startTime": "08:30", "endTime": "08:45",
        "reason": "Pirosis retroesternal nocturna recurrente y regurgitación ácida", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "128/84", "temperatureC": 36.7, "heartRate": 78, "weightKg": 86.0, "heightCm": 178},
        "clinicalNotes": "Diagnóstico: ERGE no erosiva refractaria / Hernia hiatal por deslizamiento.\nTratamiento / Receta:\n1. Esomeprazol 40mg: 1 comprimido 30 minutos antes del desayuno por 8 semanas.\n2. Alginato de sodio + Bicarbonato de potasio 10mL post-cenas y al acostarse.\n3. Medidas posturales: elevar cabecera de cama 15 cm y no acostarse hasta 2 horas postprandiales.",
        "createdAt": "2026-09-10T14:00:00Z", "updatedAt": "2026-09-15T09:10:00Z"
    },

    # PAC-008 (Valeria Daniela Rojas)
    {
        "id": "appt-019", "code": "CM-0019", "patientId": "pac-008", "doctorId": "doc-002", "specialtyId": "esp-derma",
        "date": "2026-10-06", "timeSlot": "09:00 - 09:15", "startTime": "09:00", "endTime": "09:15",
        "reason": "Brote inflamatorio severo de rosácea facial con pápulas y sensación de ardor", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "110/68", "temperatureC": 36.6, "heartRate": 70, "weightKg": 52.0, "heightCm": 164},
        "clinicalNotes": "Diagnóstico: Rosácea pápulo-pustulosa moderada-severa con proliferación de Demodex.\nTratamiento / Receta:\n1. Ivermectina 1% crema tópica: Aplicar capa fina en mejillas y nariz cada noche por 12 semanas.\n2. Agua termal calmante pulverizada 3 veces al día.\n3. Fotoprotección mineral FPS 50+ reaplicada cada 3 horas.",
        "createdAt": "2026-10-02T11:00:00Z", "updatedAt": "2026-10-06T09:25:00Z"
    },

    # PAC-009 (Hugo Ernesto Banzer)
    {
        "id": "appt-020", "code": "CM-0020", "patientId": "pac-009", "doctorId": "doc-001", "specialtyId": "esp-cardio",
        "date": "2026-09-21", "timeSlot": "08:00 - 08:15", "startTime": "08:00", "endTime": "08:15",
        "reason": "Control anual post-stent coronario y revisión de esquema de doble antiagregación", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "122/78", "temperatureC": 36.5, "heartRate": 62, "weightKg": 74.0, "heightCm": 170},
        "clinicalNotes": "Diagnóstico: Cardiopatía isquémica estable. Stent permeable en ADA. Clase funcional NYHA I.\nTratamiento / Receta:\n1. Suspender Clopidogrel (completados 12 meses post-angioplastia).\n2. Continuar monoterapia con Aspirina 100mg/día indefinido.\n3. Rosuvastatina 20mg nocturno (meta LDL < 55 mg/dL).\n4. Carvedilol 12.5mg cada 12 horas.",
        "createdAt": "2026-09-17T08:30:00Z", "updatedAt": "2026-09-21T08:35:00Z"
    },
    {
        "id": "appt-021", "code": "CM-0021", "patientId": "pac-009", "doctorId": "doc-019", "specialtyId": "esp-medvasc",
        "date": "2026-10-13", "timeSlot": "14:30 - 14:45", "startTime": "14:30", "endTime": "14:45",
        "reason": "Edema bimaleolar vespertino, pesadez en pantorrillas y dermatitis ocre incipiente", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "125/80", "temperatureC": 36.6, "heartRate": 65, "weightKg": 74.5, "heightCm": 170},
        "clinicalNotes": "Diagnóstico: Insuficiencia venosa crónica miembros inferiores CEAP C4a.\nTratamiento / Receta:\n1. Diosmina micronizada 450mg + Hesperidina 50mg: 1 comprimido cada 12h por 60 días.\n2. Medias elásticas de compresión graduada 20-30 mmHg desde el despertar.\n3. Elevación de miembros inferiores durante 20 minutos 3 veces al día.",
        "createdAt": "2026-10-09T10:00:00Z", "updatedAt": "2026-10-13T15:05:00Z"
    },

    # PAC-010 (Camila Andrea Zeballos)
    {
        "id": "appt-022", "code": "CM-0022", "patientId": "pac-010", "doctorId": "doc-005", "specialtyId": "esp-gineco",
        "date": "2026-08-25", "timeSlot": "09:30 - 09:45", "startTime": "09:30", "endTime": "09:45",
        "reason": "Amenorrea secundaria de 3 meses de evolución y acné inflamatorio mandibular", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "115/70", "temperatureC": 36.5, "heartRate": 74, "weightKg": 61.5, "heightCm": 163},
        "clinicalNotes": "Diagnóstico: Síndrome de Ovario Poliquístico (SOP) + Hiperandrogenismo clínico.\nTratamiento / Receta:\n1. Anticonceptivo oral (Drospirenona 3mg + Etinilestradiol 0.03mg): 1 comprimido diario a la misma hora iniciando con sangrado por deprivación.\n2. Metformina 500mg con la cena para optimizar sensibilidad a la insulina.\n3. Mioinositol 2g/día.",
        "createdAt": "2026-08-20T12:00:00Z", "updatedAt": "2026-08-25T10:00:00Z"
    },

    # PAC-011 (Jorge Eduardo Salmón)
    {
        "id": "appt-023", "code": "CM-0023", "patientId": "pac-011", "doctorId": "doc-006", "specialtyId": "esp-trauma",
        "date": "2026-07-16", "timeSlot": "14:00 - 14:15", "startTime": "14:00", "endTime": "14:15",
        "reason": "Control semestral post-cirugía LCA y meniscectomía de rodilla derecha", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "120/78", "temperatureC": 36.6, "heartRate": 68, "weightKg": 78.0, "heightCm": 177},
        "clinicalNotes": "Diagnóstico: Postoperatorio tardío de ligamentoplastia LCA rodilla derecha. Lachman negativo, tope firme. Rango de movilidad: flexión 130°, extensión completa 0°.\nTratamiento / Receta:\n1. Autorizado retorno a trote suave en línea recta sobre césped/pista.\n2. Mantener fortalecimiento de isquiotibiales y cuádriceps.\n3. Sulfato de glucosamina 1500mg día por 3 meses.",
        "createdAt": "2026-07-12T09:00:00Z", "updatedAt": "2026-07-16T14:30:00Z"
    },

    # PAC-012 (Mariana Isabel Ardaya)
    {
        "id": "appt-024", "code": "CM-0024", "patientId": "pac-012", "doctorId": "doc-017", "specialtyId": "esp-psiquia",
        "date": "2026-09-03", "timeSlot": "15:00 - 15:15", "startTime": "15:00", "endTime": "15:15",
        "reason": "Seguimiento psicofarmacológico de trastorno depresivo y desescalada de ansiolítico", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "116/72", "temperatureC": 36.5, "heartRate": 70, "weightKg": 56.0, "heightCm": 166},
        "clinicalNotes": "Diagnóstico: Trastorno Depresivo Mayor en remisión parcial sostenida (HAM-D 7). Eutímica, sin ideación autolítica ni anhedonia.\nTratamiento / Receta:\n1. Sertralina 100mg matutino de mantenimiento.\n2. Reducir Clonazepam a 0.25mg nocturno por 14 días y luego suspender.\n3. Continuar psicoterapia cognitivo conductual quincenal.",
        "createdAt": "2026-08-30T15:00:00Z", "updatedAt": "2026-09-03T15:40:00Z"
    },

    # PAC-013 (Alejandro Balcázar)
    {
        "id": "appt-025", "code": "CM-0025", "patientId": "pac-013", "doctorId": "doc-013", "specialtyId": "esp-orl",
        "date": "2026-08-18", "timeSlot": "15:30 - 15:45", "startTime": "15:30", "endTime": "15:45",
        "reason": "Obstrucción nasal crónica fija izquierda, anosmia parcial y cefalea frontal", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "124/80", "temperatureC": 36.7, "heartRate": 72, "weightKg": 81.0, "heightCm": 175},
        "clinicalNotes": "Diagnóstico: Rinosinusitis crónica polipoidea bilateral + Desviación septal nasal izquierda Grado III.\nTratamiento / Receta:\n1. Mometasona spray 50mcg: 2 disparos por fosa nasal cada 12h.\n2. Prednisona 20mg/día por 5 días para desinflamación polipoidea.\n3. Solicitud de Tomografía Computarizada de Senos Paranasales corte coronal y axial.",
        "createdAt": "2026-08-15T11:00:00Z", "updatedAt": "2026-08-18T16:15:00Z"
    },

    # PAC-014 (Beatriz Esperanza Claure)
    {
        "id": "appt-026", "code": "CM-0026", "patientId": "pac-014", "doctorId": "doc-009", "specialtyId": "esp-endo",
        "date": "2026-07-20", "timeSlot": "11:30 - 11:45", "startTime": "11:30", "endTime": "11:45",
        "reason": "Control de hipotiroidismo post-tiroidectomía y ajuste de levotiroxina", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "126/80", "temperatureC": 36.4, "heartRate": 66, "weightKg": 78.5, "heightCm": 157},
        "clinicalNotes": "Diagnóstico: Hipotiroidismo iatrogénico sustituido. TSH actual: 2.3 mUI/L (Eutiroidea).\nTratamiento / Receta:\n1. Levotiroxina 100mcg VO diaria en ayuno con 200ml de agua natural.\n2. Carbonato de Calcio 1250mg (500mg Ca elemental) + Vitamina D3 400 UI con el almuerzo.\n3. Control laboratorial en 6 meses.",
        "createdAt": "2026-07-16T09:00:00Z", "updatedAt": "2026-07-20T12:00:00Z"
    },

    # PAC-015 (Daniel Gonzalo Prado)
    {
        "id": "appt-027", "code": "CM-0027", "patientId": "pac-015", "doctorId": "doc-011", "specialtyId": "esp-neumo",
        "date": "2026-09-09", "timeSlot": "09:00 - 09:15", "startTime": "09:00", "endTime": "09:15",
        "reason": "Disnea de medianos esfuerzos mMRC 2 y tos productiva matutina habitual", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "132/84", "temperatureC": 36.6, "heartRate": 78, "weightKg": 76.0, "heightCm": 172},
        "clinicalNotes": "Diagnóstico: EPOC Moderado Grupo B (FEV1 64%). Ruidos respiratorios disminuidos globalmente, sibilancias espiratorias aisladas.\nTratamiento / Receta:\n1. Tiotropio 18mcg polvo para inhalación: 1 cápsula inhalada cada 24 horas por la mañana.\n2. Salbutamol inhalador 100mcg SOS ante disnea súbita.\n3. Programa de rehabilitación respiratoria ambulatoria y vacunación antigripal anual.",
        "createdAt": "2026-09-05T08:30:00Z", "updatedAt": "2026-09-09T09:35:00Z"
    },

    # PAC-016 (Natalia Sofía Antelo)
    {
        "id": "appt-028", "code": "CM-0028", "patientId": "pac-016", "doctorId": "doc-007", "specialtyId": "esp-oftalmo",
        "date": "2026-08-28", "timeSlot": "11:00 - 11:15", "startTime": "11:00", "endTime": "11:15",
        "reason": "Tonometría de aplanación y control de presión intraocular post-SLT", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "118/74", "temperatureC": 36.5, "heartRate": 68, "weightKg": 59.0, "heightCm": 162},
        "clinicalNotes": "Diagnóstico: Glaucoma primario de ángulo abierto compensado. PIO OD: 15 mmHg, PIO OI: 14 mmHg (meta < 16 alcanzada).\nTratamiento / Receta:\n1. Latanoprost 0.005% colirio: 1 gota en ambos ojos cada noche a las 21:00.\n2. Mantener técnica de oclusión del punto lagrimal durante 1 minuto post-instilación.\n3. Próximo control campimétrico en 6 meses.",
        "createdAt": "2026-08-24T10:00:00Z", "updatedAt": "2026-08-28T11:30:00Z"
    },

    # PAC-017 (Ricardo Andrés Melgar)
    {
        "id": "appt-029", "code": "CM-0029", "patientId": "pac-017", "doctorId": "doc-008", "specialtyId": "esp-uro",
        "date": "2026-09-16", "timeSlot": "16:00 - 16:15", "startTime": "16:00", "endTime": "16:15",
        "reason": "Evaluación de UROTAC de control y perfil metabólico urinario de 24 horas", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "128/82", "temperatureC": 36.6, "heartRate": 72, "weightKg": 81.5, "heightCm": 176},
        "clinicalNotes": "Diagnóstico: Nefrolitiasis cálcica inactiva post-litotricia. UROTAC sin litiasis obstructivas residuales. Calciuria normalizada (180 mg/24h).\nTratamiento / Receta:\n1. Citrato de Potasio 10 mEq: 1 sobre disuelto en un vaso de agua 3 veces al día.\n2. Hidroclorotiazida 25mg matutino.\n3. Ingesta hídrica forzada a 3 litros de agua diarios.",
        "createdAt": "2026-09-12T14:00:00Z", "updatedAt": "2026-09-16T16:30:00Z"
    },

    # PAC-018 (Silvia Teresa Barba)
    {
        "id": "appt-030", "code": "CM-0030", "patientId": "pac-018", "doctorId": "doc-018", "specialtyId": "esp-reuma",
        "date": "2026-09-11", "timeSlot": "09:30 - 09:45", "startTime": "09:30", "endTime": "09:45",
        "reason": "Control de Lupus Eritematoso Sistémico, artralgias y evaluación de sedimento urinario", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "112/70", "temperatureC": 36.6, "heartRate": 74, "weightKg": 55.0, "heightCm": 160},
        "clinicalNotes": "Diagnóstico: LES en baja actividad clínica (SLEDAI 2). Proteinuria de 24h negativa (80 mg). C3 y C4 en rangos normales.\nTratamiento / Receta:\n1. Hidroxicloroquina 200mg/día con almuerzo.\n2. Prednisona 5mg matutino.\n3. Protección solar estricta FPS 50+ y ropa con protección UV.\n4. Lágrimas artificiales carboximetilcelulosa al 1% cada 4h por Sjögren.",
        "createdAt": "2026-09-08T10:00:00Z", "updatedAt": "2026-09-11T10:10:00Z"
    },

    # PAC-019 (Gabriel Ignacio Justiniano)
    {
        "id": "appt-031", "code": "CM-0031", "patientId": "pac-019", "doctorId": "doc-006", "specialtyId": "esp-trauma",
        "date": "2026-09-07", "timeSlot": "14:30 - 14:45", "startTime": "14:30", "endTime": "14:45",
        "reason": "Lumbociatalgia izquierda con irradiación a dermatoma S1 y parestesias en talón", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "122/76", "temperatureC": 36.5, "heartRate": 68, "weightKg": 73.0, "heightCm": 178},
        "clinicalNotes": "Diagnóstico: Hernia discal L5-S1 extruida subligamentaria con radiculopatía ciática S1. Signo de Lasègue positivo a 40° izquierda.\nTratamiento / Receta:\n1. Pregabalina 75mg por la noche durante 30 días.\n2. Etoricoxib 90mg diario con alimentos por 7 días.\n3. Derivación a Fisioterapia para descompresión axial y tracción lumbar.",
        "createdAt": "2026-09-03T11:00:00Z", "updatedAt": "2026-09-07T15:00:00Z"
    },
    {
        "id": "appt-032", "code": "CM-0032", "patientId": "pac-019", "doctorId": "doc-014", "specialtyId": "esp-fisio",
        "date": "2026-09-14", "timeSlot": "09:00 - 09:45", "startTime": "09:00", "endTime": "09:45",
        "reason": "Sesión de descompresión lumbar y electroanalgesia TENS", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "120/75", "temperatureC": 36.4, "heartRate": 66, "weightKg": 73.0, "heightCm": 178},
        "clinicalNotes": "Diagnóstico: Radiculalgia ciática S1 izquierda.\nTratamiento:\n1. TENS convencional 100 Hz en región glútea y posterior de muslo por 20 min.\n2. Magnetoterapia en raquis lumbosacro 50 Gauss.\n3. Ejercicios isométricos del transverso abdominal y método McKenzie en extensión.",
        "createdAt": "2026-09-10T09:00:00Z", "updatedAt": "2026-09-14T10:00:00Z"
    },

    # PAC-020 (Paula Andrea Monasterio)
    {
        "id": "appt-033", "code": "CM-0033", "patientId": "pac-020", "doctorId": "doc-010", "specialtyId": "esp-gastro",
        "date": "2026-08-04", "timeSlot": "09:30 - 09:45", "startTime": "09:30", "endTime": "09:45",
        "reason": "Control semestral de Enfermedad Celíaca, curva de anticuerpos y hemograma", "status": "Atendida",
        "vitalSigns": {"bloodPressure": "110/68", "temperatureC": 36.5, "heartRate": 72, "weightKg": 51.5, "heightCm": 165},
        "clinicalNotes": "Diagnóstico: Enfermedad Celíaca en remisión serológica y clínica completa. Anticuerpos anti-tTG IgA: 2.1 U/mL (Negativo < 7). Hemoglobina: 13.2 g/dL (ferropenia resuelta).\nTratamiento / Receta:\n1. Continuar dieta 100% libre de gluten de por vida sin transgresiones.\n2. Vitamina D3 50.000 UI mensual.\n3. Repetir densitometría ósea en 12 meses.",
        "createdAt": "2026-07-30T10:00:00Z", "updatedAt": "2026-08-04T10:15:00Z"
    },

    # Additional Upcoming Appointments for November 2026
    {
        "id": "appt-034", "code": "CM-0034", "patientId": "pac-006", "doctorId": "doc-018", "specialtyId": "esp-reuma",
        "date": "2026-11-20", "timeSlot": "09:00 - 09:15", "startTime": "09:00", "endTime": "09:15",
        "reason": "Control bimestral de terapia biológica y ecografía articular de muñecas", "status": "Programada",
        "createdAt": "2026-10-25T09:00:00Z", "updatedAt": "2026-10-25T09:00:00Z"
    },
    {
        "id": "appt-035", "code": "CM-0035", "patientId": "pac-007", "doctorId": "doc-010", "specialtyId": "esp-gastro",
        "date": "2026-11-20", "timeSlot": "14:30 - 14:45", "startTime": "14:30", "endTime": "14:45",
        "reason": "Revisión post-tratamiento de reflujo y control de esteatosis hepática", "status": "Confirmada",
        "createdAt": "2026-10-25T09:30:00Z", "updatedAt": "2026-10-25T09:30:00Z"
    },
    {
        "id": "appt-036", "code": "CM-0036", "patientId": "pac-008", "doctorId": "doc-002", "specialtyId": "esp-derma",
        "date": "2026-11-24", "timeSlot": "10:00 - 10:15", "startTime": "10:00", "endTime": "10:15",
        "reason": "Control de ivermectina tópica en rosácea y sesión de luz pulsada intensa", "status": "Programada",
        "createdAt": "2026-10-26T10:00:00Z", "updatedAt": "2026-10-26T10:00:00Z"
    },
    {
        "id": "appt-037", "code": "CM-0037", "patientId": "pac-011", "doctorId": "doc-006", "specialtyId": "esp-trauma",
        "date": "2026-11-19", "timeSlot": "15:00 - 15:15", "startTime": "15:00", "endTime": "15:15",
        "reason": "Prueba de esfuerzo funcional isocinética de rodilla derecha", "status": "Confirmada",
        "createdAt": "2026-10-26T11:00:00Z", "updatedAt": "2026-10-26T11:00:00Z"
    },
    {
        "id": "appt-038", "code": "CM-0038", "patientId": "pac-015", "doctorId": "doc-011", "specialtyId": "esp-neumo",
        "date": "2026-11-18", "timeSlot": "09:30 - 09:45", "startTime": "09:30", "endTime": "09:45",
        "reason": "Espirometría forzada anual y titulación de broncodilatador de acción prolongada", "status": "Programada",
        "createdAt": "2026-10-27T08:00:00Z", "updatedAt": "2026-10-27T08:00:00Z"
    },
    {
        "id": "appt-039", "code": "CM-0039", "patientId": "pac-017", "doctorId": "doc-008", "specialtyId": "esp-uro",
        "date": "2026-11-18", "timeSlot": "16:30 - 16:45", "startTime": "16:30", "endTime": "16:45",
        "reason": "Control de citraturia y ecografía renal bilateral preventiva", "status": "Confirmada",
        "createdAt": "2026-10-27T09:00:00Z", "updatedAt": "2026-10-27T09:00:00Z"
    },
    {
        "id": "appt-040", "code": "CM-0040", "patientId": "pac-020", "doctorId": "doc-010", "specialtyId": "esp-gastro",
        "date": "2026-11-17", "timeSlot": "10:30 - 10:45", "startTime": "10:30", "endTime": "10:45",
        "reason": "Consulta de seguimiento nutricional y valoración de absorción de hierro", "status": "Programada",
        "createdAt": "2026-10-27T10:00:00Z", "updatedAt": "2026-10-27T10:00:00Z"
    }
]

print(f"Generated {len(appointments_data)} total appointments (including past clinical consultations).")

# Update backend/src/data/initialData.ts and frontend/src/data/initialData.ts
def update_initial_data_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Format JSON strings for TypeScript
    patients_ts = json.dumps(patients_data, indent=2, ensure_ascii=False)
    appointments_ts = json.dumps(appointments_data, indent=2, ensure_ascii=False)

    # Replace INITIAL_PATIENTS
    patt_pac = r'export const INITIAL_PATIENTS: Patient\[\] = \[[\s\S]*?\n\];'
    repl_pac = f'export const INITIAL_PATIENTS: Patient[] = {patients_ts};'
    content = re.sub(patt_pac, repl_pac, content)

    # Replace INITIAL_APPOINTMENTS
    patt_appt = r'export const INITIAL_APPOINTMENTS: Appointment\[\] = \[[\s\S]*?\n\];'
    repl_appt = f'export const INITIAL_APPOINTMENTS: Appointment[] = {appointments_ts};'
    content = re.sub(patt_appt, repl_appt, content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {filepath} successfully.")

update_initial_data_file("/home/andrez/Documentos/SI/MedicalProyect/Medical/backend/src/data/initialData.ts")
update_initial_data_file("/home/andrez/Documentos/SI/MedicalProyect/Medical/frontend/src/data/initialData.ts")

# Now update backend/database/local_db.json
db_path = "/home/andrez/Documentos/SI/MedicalProyect/Medical/backend/database/local_db.json"
local_db = {}
if os.path.exists(db_path):
    with open(db_path, "r", encoding="utf-8") as f:
        local_db = json.load(f)

local_db["patients"] = patients_data
local_db["appointments"] = appointments_data

# Make sure all 20 patients have active user accounts in local_db["users"]
existing_users = local_db.get("users", [])
user_emails = {u["email"].lower(): u for u in existing_users}

for p in patients_data:
    email = p["email"].lower()
    if email not in user_emails:
        new_user = {
            "id": f"usr-{p['id']}",
            "email": email,
            "passwordHash": default_patient_pass["hash"],
            "salt": default_patient_pass["salt"],
            "fullName": f"{p['firstName']} {p['lastName']}",
            "role": "Paciente",
            "status": "ACTIVE",
            "ci": p["ci"],
            "patientId": p["id"],
            "patientCi": p["ci"],
            "phone": p["phone"],
            "createdAt": "2026-01-20T08:00:00Z",
            "updatedAt": "2026-01-20T08:00:00Z",
            "failedLoginAttempts": 0
        }
        existing_users.append(new_user)
        user_emails[email] = new_user
    else:
        # Update patient link
        user_emails[email]["patientId"] = p["id"]
        user_emails[email]["patientCi"] = p["ci"]
        user_emails[email]["role"] = "Paciente"
        user_emails[email]["status"] = "ACTIVE"

local_db["users"] = existing_users

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(local_db, f, indent=2, ensure_ascii=False)

print(f"Updated local_db.json with {len(existing_users)} users and {len(patients_data)} patients.")

# Now update backend/src/db.ts to auto-seed all 20 patients in memory if reset
with open("/home/andrez/Documentos/SI/MedicalProyect/Medical/backend/src/db.ts", "r", encoding="utf-8") as f:
    db_ts = f.read()

# Update db.ts loadFromDiskOrSeed to synchronize all 20 patients
sync_code = '''
        // Synchronize all patients from INITIAL_PATIENTS so all 20 have active user logins
        let hasNewPatients = false;
        const defaultPacPass = hashPassword('Paciente123!', 'paciente_salt_2026');
        for (const pac of this.patients) {
          if (!pac.email) continue;
          const exists = this.users.some(
            u => u.patientId === pac.id || u.email.toLowerCase() === pac.email!.toLowerCase()
          );
          if (!exists) {
            this.users.push({
              id: `usr-${pac.id}`,
              email: pac.email.toLowerCase(),
              passwordHash: defaultPacPass.hash,
              salt: defaultPacPass.salt,
              fullName: `${pac.firstName} ${pac.lastName}`,
              role: 'Paciente',
              status: 'ACTIVE',
              ci: pac.ci,
              patientId: pac.id,
              patientCi: pac.ci,
              phone: pac.phone,
              createdAt: '2026-01-20T08:00:00Z',
              updatedAt: '2026-01-20T08:00:00Z',
              failedLoginAttempts: 0,
            });
            hasNewPatients = true;
          }
        }
        if (hasNewPatients) {
          this.saveToDisk();
        }
'''

if "Synchronize all patients from INITIAL_PATIENTS" not in db_ts:
    target_pos = "if (hasNewDoctors) {"
    db_ts = db_ts.replace(target_pos, sync_code + "\n        " + target_pos)
    with open("/home/andrez/Documentos/SI/MedicalProyect/Medical/backend/src/db.ts", "w", encoding="utf-8") as f:
        f.write(db_ts)
    print("Updated backend/src/db.ts with automatic patient synchronization!")

# Generate SQL Seed file: backend/database/seeds_pacientes_20.sql
sql_lines = [
    "-- ============================================================================",
    "-- SEEDS DE 20 PACIENTES, USUARIOS, ANTECEDENTES Y CITAS PREVIAS EXTENSAS",
    "-- Contraseña estándar para todos los pacientes: Paciente123!",
    "-- ============================================================================",
    "",
    "BEGIN;",
    "",
    "-- 1. Insertar o actualizar Rol Paciente",
    "INSERT INTO roles (nombre, descripcion) VALUES ('Paciente', 'Acceso al portal de pacientes, reservas y expedientes') ON CONFLICT (nombre) DO NOTHING;",
    "",
    "-- 2. Insertar los 20 Pacientes y sus Usuarios"
]

for p in patients_data:
    em = p["email"]
    ci = p["ci"]
    fn = p["firstName"]
    ln = p["lastName"]
    bd = p["birthDate"]
    gen = 'M' if p["gender"] == 'Masculino' else 'F'
    ph = p["phone"]
    addr = p["address"].replace("'", "''")
    cod = p["code"]
    
    # User insert
    sql_lines.append(f"""-- Paciente {cod}: {fn} {ln}
INSERT INTO usuarios (rol_id, username, correo, password_hash, salt, estado, created_at, updated_at)
SELECT id, '{em}', '{em}', '{default_patient_pass["hash"]}', '{default_patient_pass["salt"]}', 'ACTIVO', NOW(), NOW()
FROM roles WHERE nombre = 'Paciente'
ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO pacientes (usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado, created_at)
SELECT u.id, '{cod}', '{ci}', '{fn}', '{ln}', '{bd}', '{gen}', '{ph}', '{em}', '{addr}', 'ACTIVO', NOW()
FROM usuarios u WHERE u.correo = '{em}'
ON CONFLICT (ci) DO UPDATE SET direccion = EXCLUDED.direccion, telefono = EXCLUDED.telefono;

INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono, updated_at)
SELECT p.id, '{p["bloodType"]}', '{p["allergies"].replace("'", "''")}', '{p["chronicDiseases"].replace("'", "''")}', '{p["medicalHistory"].replace("'", "''")}', '{p["currentMedications"].replace("'", "''")}', '{p["emergencyContactName"].replace("'", "''")}', '{p["emergencyContactPhone"]}', NOW()
FROM pacientes p WHERE p.ci = '{ci}'
ON CONFLICT (paciente_id) DO UPDATE SET alergias = EXCLUDED.alergias, patologias_cronicas = EXCLUDED.patologias_cronicas;
""")

sql_lines.append("COMMIT;")
with open("/home/andrez/Documentos/SI/MedicalProyect/Medical/backend/database/seeds_pacientes_20.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print("Generated backend/database/seeds_pacientes_20.sql successfully!")
