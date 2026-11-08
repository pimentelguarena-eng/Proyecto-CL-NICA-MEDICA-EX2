-- =========================================================================
-- SCRIPT OFICIAL DE BASE DE DATOS POSTGRESQL
-- PROYECTO E INSTITUCIÓN: CLÍNICA MEDICAL
-- POLÍTICA: Atención médica especializada y procedimientos ambulatorios de
--           corta estancia. No cuenta con camas ni internación hospitalaria.
-- =========================================================================

-- Descomentar si se ejecuta desde psql con permisos de superusuario:
-- CREATE DATABASE clinica_medical_db;
-- \c clinica_medical_db;

-- -------------------------------------------------------------
-- SECUENCIAS
-- -------------------------------------------------------------
-- Secuencia para el Comprobante Oficial (CM-0001, CM-0002, ...)
CREATE SEQUENCE IF NOT EXISTS seq_codigo_cita START 1 INCREMENT 1;

-- -------------------------------------------------------------
-- 1. TABLA ROLES
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL
);

-- -------------------------------------------------------------
-- 2. TABLA PERMISOS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    modulo VARCHAR(80) NOT NULL,
    descripcion VARCHAR(255)
);

-- -------------------------------------------------------------
-- 3. TABLA ROL_PERMISO
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rol_permiso (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    UNIQUE (rol_id, permiso_id)
);

-- -------------------------------------------------------------
-- 4. TABLA USUARIOS (Actor Abstracto Usuario)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    username VARCHAR(80) NOT NULL UNIQUE,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    ultimo_acceso TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuario_estado CHECK (estado IN ('activo', 'inactivo', 'pendiente'))
);

-- -------------------------------------------------------------
-- 5. TABLA TOKENS_RECUPERACION (CU03 - SMTP 30 min)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tokens_recuperacion (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_en TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 6. TABLA PACIENTES (CU06, CU07 - RN01 CI Único)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    ci VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F')),
    telefono VARCHAR(30) NOT NULL,
    correo VARCHAR(150) UNIQUE,
    direccion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 7. TABLA ANTECEDENTES_MEDICOS (CU22)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS antecedentes_medicos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
    grupo_sanguineo VARCHAR(10) DEFAULT 'No especificado',
    alergias TEXT DEFAULT 'Ninguna conocida',
    patologias_cronicas TEXT DEFAULT 'Ninguna',
    cirugias_previas TEXT DEFAULT 'Ninguna',
    medicacion_habitual TEXT DEFAULT 'Ninguna',
    contacto_emergencia_nombre VARCHAR(120),
    contacto_emergencia_telefono VARCHAR(30),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 8. TABLA ESPECIALIDADES (22 Especialidades + 9 Servicios - CU10)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS especialidades (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL UNIQUE,
    tipo_catalogo VARCHAR(30) NOT NULL DEFAULT 'ESPECIALIDAD'
        CHECK (tipo_catalogo IN ('ESPECIALIDAD', 'SERVICIO_DIAGNOSTICO')),
    categoria VARCHAR(50) NOT NULL DEFAULT 'Clínica',
    descripcion_orientativa TEXT NOT NULL,
    servicios_especificos TEXT NOT NULL,
    duracion_minutos INTEGER NOT NULL DEFAULT 15,
    costo_consulta NUMERIC(10,2) NOT NULL DEFAULT 150.00 CHECK (costo_consulta >= 0),
    politica_ambulatoria TEXT NOT NULL DEFAULT 'Atención médica especializada y procedimientos ambulatorios de corta estancia. No contamos con camas ni servicio de internación hospitalaria.',
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

-- -------------------------------------------------------------
-- 9. TABLA CONSULTORIOS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultorios (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    piso VARCHAR(30) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
);

-- -------------------------------------------------------------
-- 10. TABLA MEDICOS (CU09)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    consultorio_id INTEGER REFERENCES consultorios(id),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    matricula_profesional VARCHAR(50) NOT NULL UNIQUE,
    ci VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    estado_operativo VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado_operativo IN ('activo', 'inactivo'))
);

-- -------------------------------------------------------------
-- 11. TABLA MEDICO_ESPECIALIDAD (CU11)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medico_especialidad (
    id SERIAL PRIMARY KEY,
    medico_id INTEGER NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    especialidad_id INTEGER NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (medico_id, especialidad_id)
);

-- -------------------------------------------------------------
-- 12. TABLA HORARIOS_ATENCION (CU12 - Bloques de 15 minutos RF05)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios_atencion (
    id SERIAL PRIMARY KEY,
    medico_id INTEGER NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    especialidad_id INTEGER NOT NULL REFERENCES especialidades(id),
    consultorio_id INTEGER NOT NULL REFERENCES consultorios(id),
    dia_semana VARCHAR(15) NOT NULL
        CHECK (dia_semana IN ('Lunes', 'Martes', 'Miércoles', 'Miercoles', 'Jueves', 'Viernes', 'Sábado', 'Sabado')),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_bloque_min INTEGER NOT NULL DEFAULT 15 CHECK (duracion_bloque_min IN (15, 30)),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    CONSTRAINT chk_horario_rango CHECK (hora_fin > hora_inicio),
    CONSTRAINT chk_sabado_mediodia CHECK (dia_semana NOT IN ('Sábado', 'Sabado') OR hora_fin <= '13:00:00'::TIME)
);

-- -------------------------------------------------------------
-- 13. TABLA CITAS_MEDICAS (CU13 a CU19)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas_medicas (
    id SERIAL PRIMARY KEY,
    codigo_cita VARCHAR(20) NOT NULL UNIQUE DEFAULT ('CM-' || LPAD(nextval('seq_codigo_cita')::TEXT, 4, '0')),
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    medico_id INTEGER NOT NULL REFERENCES medicos(id),
    especialidad_id INTEGER NOT NULL REFERENCES especialidades(id),
    consultorio_id INTEGER REFERENCES consultorios(id),
    fecha_cita DATE NOT NULL,
    hora_inicio_bloque TIME NOT NULL,
    hora_fin_bloque TIME NOT NULL,
    motivo_consulta TEXT,
    estado_cita VARCHAR(25) NOT NULL DEFAULT 'Programada'
        CHECK (estado_cita IN ('Pendiente', 'Programada', 'Confirmada', 'Atendida', 'Cancelada', 'Inasistencia')),
    motivo_cancelacion TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cita_bloque CHECK (hora_fin_bloque > hora_inicio_bloque)
);

-- -------------------------------------------------------------
-- 14. TABLA PAGOS_CITAS (CU15 - Pasarela de Pago)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos_citas (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER NOT NULL UNIQUE REFERENCES citas_medicas(id) ON DELETE CASCADE,
    monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
    metodo_pago VARCHAR(40) NOT NULL CHECK (metodo_pago IN ('QR_SIMPLE', 'TARJETA', 'TRANSFERENCIA', 'VENTANILLA')),
    transaccion_pasarela_id VARCHAR(100) UNIQUE,
    estado_pago VARCHAR(25) NOT NULL DEFAULT 'Aprobado'
        CHECK (estado_pago IN ('Pendiente', 'Aprobado', 'Rechazado')),
    comprobante_oficial_nro VARCHAR(30) NOT NULL UNIQUE,
    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 15. TABLA HISTORIAL_CLINICO (CU20, CU21 - Registro Inmutable)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_clinico (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER NOT NULL UNIQUE REFERENCES citas_medicas(id),
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    medico_id INTEGER NOT NULL REFERENCES medicos(id),
    presion_arterial VARCHAR(20),
    temperatura_c NUMERIC(4,1),
    frecuencia_cardiaca INTEGER,
    peso_kg NUMERIC(5,2),
    talla_cm NUMERIC(5,2),
    sintomas TEXT NOT NULL,
    anamnesis TEXT NOT NULL,
    diagnostico_principal TEXT NOT NULL,
    tratamiento_receta TEXT NOT NULL,
    observaciones TEXT,
    fecha_atencion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 16. TABLA BITACORA (CU05 - Auditoría Inmutable)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bitacora (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    rol_ejecutor VARCHAR(50) NOT NULL,
    modulo_afectado VARCHAR(80) NOT NULL,
    tipo_evento VARCHAR(60) NOT NULL,
    descripcion_accion TEXT NOT NULL,
    ip_direccion VARCHAR(45) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- PROCEDIMIENTOS ALMACENADOS (PL/pgSQL) Y TRIGGERS
-- =============================================================

-- 1. Función para Cálculo Dinámico de Bloques Disponibles (RF05 - CU13)
CREATE OR REPLACE FUNCTION sp_calcular_bloques_disponibles_15min(
    p_medico_id INTEGER,
    p_especialidad_id INTEGER,
    p_fecha DATE,
    p_dia_semana VARCHAR
)
RETURNS TABLE (
    bloque_inicio TIME,
    bloque_fin TIME,
    consultorio_id INTEGER,
    estado_cupo VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH bloques_generados AS (
        SELECT
            (gs)::TIME AS b_inicio,
            (gs + INTERVAL '15 minutes')::TIME AS b_fin,
            h.consultorio_id AS c_id
        FROM horarios_atencion h,
        GENERATE_SERIES(
            p_fecha + h.hora_inicio,
            p_fecha + h.hora_fin - INTERVAL '15 minutes',
            INTERVAL '15 minutes'
        ) AS gs
        WHERE h.medico_id = p_medico_id
          AND h.especialidad_id = p_especialidad_id
          AND h.dia_semana = p_dia_semana
          AND h.estado = 'activo'
    )
    SELECT
        bg.b_inicio,
        bg.b_fin,
        bg.c_id,
        'DISPONIBLE'::VARCHAR
    FROM bloques_generados bg
    WHERE NOT EXISTS (
        SELECT 1 FROM citas_medicas cm
        WHERE cm.medico_id = p_medico_id
          AND cm.fecha_cita = p_fecha
          AND cm.hora_inicio_bloque = bg.b_inicio
          AND cm.estado_cita IN ('Pendiente', 'Programada', 'Confirmada', 'Atendida')
    )
    ORDER BY bg.b_inicio;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para Evitar Solapamiento de Citas Médicas (RN07)
CREATE OR REPLACE FUNCTION fn_validar_colision_cita()
RETURNS TRIGGER AS $$
DECLARE
    v_ocupado INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ocupado
    FROM citas_medicas
    WHERE medico_id = NEW.medico_id
      AND fecha_cita = NEW.fecha_cita
      AND hora_inicio_bloque = NEW.hora_inicio_bloque
      AND estado_cita IN ('Pendiente', 'Programada', 'Confirmada', 'Atendida')
      AND id != COALESCE(NEW.id, 0);

    IF v_ocupado > 0 THEN
        RAISE EXCEPTION 'CONFLICTO DE AGENDA (RN07): El bloque horario ya se encuentra ocupado para este médico.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_evitar_colision_cita ON citas_medicas;
CREATE TRIGGER trg_evitar_colision_cita
BEFORE INSERT OR UPDATE ON citas_medicas
FOR EACH ROW EXECUTE FUNCTION fn_validar_colision_cita();

-- 3. Trigger para Proteger la Inmutabilidad del Historial Clínico (CU20)
CREATE OR REPLACE FUNCTION fn_proteger_historial_inmutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'PROHIBIDO: Los registros del Historial Clínico de CLÍNICA MEDICAL son inmutables por normativa legal.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_historial_inmutable ON historial_clinico;
CREATE TRIGGER trg_historial_inmutable
BEFORE UPDATE OR DELETE ON historial_clinico
FOR EACH ROW EXECUTE FUNCTION fn_proteger_historial_inmutable();

-- =============================================================
-- INSERCIÓN DE DATOS MAESTROS (POBLACIÓN INICIAL)
-- =============================================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total a configuración, médicos, 22 especialidades, horarios, bitácora y reportes'),
('Recepcionista', 'Registro de pacientes por CI, agendamiento, reprogramación, cancelación y asistencia en sala'),
('Medico', 'Consulta de agenda diaria, antecedentes médicos y registro en historial clínico'),
('Paciente', 'Autogestión de perfil, reserva de citas web con pasarela de pago y consulta de historial')
ON CONFLICT (nombre) DO NOTHING;

-- Consultorios
INSERT INTO consultorios (codigo, nombre, piso) VALUES
('CONS-101', 'Consultorio de Cardiología y Medicina Vascular', 'Piso 1'),
('CONS-102', 'Consultorio de Medicina General y Pediatría', 'Piso 1'),
('CONS-201', 'Consultorio de Ginecología y Mastología', 'Piso 2'),
('CONS-202', 'Consultorio de Traumatología y Reumatología', 'Piso 2'),
('CONS-301', 'Gabinete de Fisioterapia y Kinesiología', 'Piso 3')
ON CONFLICT (codigo) DO NOTHING;

-- Catálogo de las 22 Especialidades Médicas
INSERT INTO especialidades (codigo, nombre, tipo_catalogo, categoria, descripcion_orientativa, servicios_especificos, costo_consulta) VALUES
('ESP-01', 'CARDIOLOGÍA', 'ESPECIALIDAD', 'Clínica', 'Evaluación integral cardiovascular ambulatoria', 'Electrocardiograma digital de reposo, Monitoreo MAPA 24h, Holter de ritmo cardíaco, riesgo quirúrgico.', 200.00),
('ESP-02', 'DERMATOLOGÍA', 'ESPECIALIDAD', 'Clínica', 'Diagnóstico y tratamiento ambulatorio de la piel', 'Dermatoscopía digital, acné y rosácea, crioterapia de lesiones, extirpación menor ambulatoria.', 180.00),
('ESP-03', 'ENDOCRINOLOGÍA', 'ESPECIALIDAD', 'Clínica', 'Manejo especializado de trastornos hormonales y metabólicos', 'Control de diabetes mellitus, patología tiroidea, nódulos y metabolismo hormonal.', 200.00),
('ESP-04', 'FISIOTERAPIA', 'ESPECIALIDAD', 'Rehabilitación', 'Recuperación funcional y kinesioterapia ambulatoria', 'Rehabilitación motora traumatológica, dolor cervical/lumbar, lesiones deportivas, electroestimulación.', 120.00),
('ESP-05', 'FONOAUDIOLOGÍA', 'ESPECIALIDAD', 'Rehabilitación', 'Rehabilitación del habla, audición y deglución', 'Terapia de deglución (disfagia), articulación del lenguaje infantil y rehabilitación de la voz.', 130.00),
('ESP-06', 'GASTROENTEROLOGÍA', 'ESPECIALIDAD', 'Clínica', 'Atención de patologías del aparato digestivo e hígado', 'Reflujo gastroesofágico, gastritis, Helicobacter pylori, colon irritable e hígado graso.', 190.00),
('ESP-07', 'GINECOLOGÍA', 'ESPECIALIDAD', 'Quirúrgica', 'Salud integral de la mujer y prevención ginecológica', 'Control anual, citología cervical, Papanicolaou, colposcopía HD y planificación familiar.', 180.00),
('ESP-08', 'MASTOLOGÍA', 'ESPECIALIDAD', 'Quirúrgica', 'Diagnóstico precoz y patología mamaria ambulatoria', 'Examen clínico mamario, detección precoz, correlación ecográfica y punción PAAF ambulatoria.', 220.00),
('ESP-09', 'MEDICINA GENERAL', 'ESPECIALIDAD', 'Clínica', 'Atención primaria, prevención y triaje clínico', 'Chequeos preventivos, patologías agudas, certificados de salud y triaje asistencial.', 100.00),
('ESP-10', 'MEDICINA VASCULAR', 'ESPECIALIDAD', 'Clínica', 'Diagnóstico y tratamiento circulatorio periférico', 'Insuficiencia venosa, várices, escleroterapia ambulatoria y prevención de trombosis.', 210.00),
('ESP-11', 'NEUMOLOGÍA', 'ESPECIALIDAD', 'Clínica', 'Salud respiratoria y pruebas funcionales pulmonares', 'Espirometría simple y con broncodilatador, control de asma, EPOC y apnea del sueño.', 190.00),
('ESP-12', 'NEUROLOGÍA', 'ESPECIALIDAD', 'Clínica', 'Evaluación del sistema nervioso central y periférico', 'Cefaleas complejas, migrañas, epilepsia, temblores, neuropatías periféricas y memoria.', 220.00),
('ESP-13', 'NUTRIOLOGÍA', 'ESPECIALIDAD', 'Clínica', 'Evaluación antropométrica y dietoterapia clínica', 'Bioimpedanciometría corporal, planes para diabetes e hipertensión, nutrición clínica.', 140.00),
('ESP-14', 'OFTALMOLOGÍA', 'ESPECIALIDAD', 'Quirúrgica', 'Salud visual y diagnóstico ocular computarizado', 'Agudeza visual computarizada, tonometría de aplanación (glaucoma), biomicroscopía y fondo de ojo.', 180.00),
('ESP-15', 'OTORRINOLARINGOLOGÍA', 'ESPECIALIDAD', 'Quirúrgica', 'Atención de oído, nariz, garganta y laringe', 'Videootoscopía, nasofaringoscopía, lavado y aspiración ótica, rinitis y sinusitis.', 180.00),
('ESP-16', 'PEDIATRÍA', 'ESPECIALIDAD', 'Clínica', 'Cuidado integral del desarrollo infantil y adolescente', 'Control de niño sano, curvas de crecimiento, esquemas de vacunación e infecciones pediátricas.', 150.00),
('ESP-17', 'PROCTOLOGÍA', 'ESPECIALIDAD', 'Quirúrgica', 'Diagnóstico y tratamiento coloproctológico de consultorio', 'Anoscopía diagnóstica de consultorio, ligadura elástica de hemorroides y fisuras anales.', 210.00),
('ESP-18', 'PSICOLOGÍA', 'ESPECIALIDAD', 'Salud Mental', 'Salud mental y psicoterapia clínica ambulatoria', 'Psicoterapia cognitivo-conductual, manejo de ansiedad, estrés, duelo y regulación emocional.', 150.00),
('ESP-19', 'PSIQUIATRÍA', 'ESPECIALIDAD', 'Salud Mental', 'Diagnóstico médico psiquiátrico y psicofarmacología', 'Evaluación diagnóstica médica, psicofarmacología, depresión mayor, insomnio y TDAH.', 230.00),
('ESP-20', 'REUMATOLOGÍA', 'ESPECIALIDAD', 'Clínica', 'Manejo de enfermedades articulares y autoinmunes', 'Artritis reumatoide, lupus eritematoso, infiltraciones articulares analgésicas y gota.', 210.00),
('ESP-21', 'TRAUMATOLOGÍA', 'ESPECIALIDAD', 'Quirúrgica', 'Lesiones osteomusculares y ortopedia ambulatoria', 'Inmovilizaciones ortopédicas (fibra de vidrio), esguinces, infiltración de ácido hialurónico y controles.', 190.00),
('ESP-22', 'UROLOGÍA', 'ESPECIALIDAD', 'Quirúrgica', 'Salud genitourinaria y prevención prostática', 'Chequeo prostático preventivo (PSA + tacto rectal), litiasis renal e infecciones urinarias.', 200.00)
ON CONFLICT (codigo) DO NOTHING;

-- Catálogo de los 9 Servicios Clínicos y Diagnósticos Ambulatorios
INSERT INTO especialidades (codigo, nombre, tipo_catalogo, categoria, descripcion_orientativa, servicios_especificos, costo_consulta) VALUES
('SRV-01', 'AUDIOMETRÍA', 'SERVICIO_DIAGNOSTICO', 'Diagnóstica', 'Estudio auditivo en cabina insonorizada', 'Cabina insonorizada certificada y audiometría tonal/vocal (reposo auditivo de 14h previas).', 160.00),
('SRV-02', 'BIOPSIAS', 'SERVICIO_DIAGNOSTICO', 'Diagnóstica', 'Toma ambulatoria de muestras histológicas', 'Toma ambulatoria de muestras tisulares cutáneas y de partes blandas con anestesia local.', 280.00),
('SRV-03', 'CIRUGÍAS OFTALMOLÓGICAS', 'SERVICIO_DIAGNOSTICO', 'Quirúrgica', 'Microcirugía ocular ambulatoria sin internación', 'Procedimientos de corta estancia (pterigión, chalazión, blefaroplastia menor) con alta el mismo día y sin internación.', 850.00),
('SRV-04', 'DERMATOLOGÍA (Procedimientos)', 'SERVICIO_DIAGNOSTICO', 'Clínica', 'Procedimientos dermatológicos menores', 'Crioterapia con nitrógeno líquido, electrofulguración y legrados indoloros.', 220.00),
('SRV-05', 'ELECTROMEDICINA', 'SERVICIO_DIAGNOSTICO', 'Diagnóstica', 'Estudios funcionales cardiorrespiratorios', 'Electrocardiogramas continuos, Holter 24h, espirometría digital y electrodiagnóstico.', 200.00),
('SRV-06', 'ENFERMERÍA', 'SERVICIO_DIAGNOSTICO', 'Clínica', 'Procedimientos de enfermería ambulatoria', 'Inyectables intramusculares y endovenosos, curaciones avanzadas de heridas y toma de signos vitales.', 50.00),
('SRV-07', 'FONOAUDIOLOGÍA (Servicio)', 'SERVICIO_DIAGNOSTICO', 'Rehabilitación', 'Sesiones programadas de rehabilitación vocal y deglutoria', 'Sesiones programadas de entrenamiento foniátrico y deglutorio.', 120.00),
('SRV-08', 'IMAGENOLOGÍA', 'SERVICIO_DIAGNOSTICO', 'Diagnóstica', 'Diagnóstico por imágenes digital y ecografía Doppler', 'Radiografías digitales de alta definición (Rayos X) y ecografía doppler general y vascular.', 180.00),
('SRV-09', 'PAPANICOLAOU-COLPOSCOPIA Y LABORATORIO CLÍNICO', 'SERVICIO_DIAGNOSTICO', 'Diagnóstica', 'Citología cervical, colposcopía y análisis clínicos', 'Citología cervical convencional y en base líquida, colposcopía videodirigida, más toma de muestras de sangre y orina.', 170.00)
ON CONFLICT (codigo) DO NOTHING;

-- -------------------------------------------------------------
-- POBLACIÓN DE USUARIOS INICIALES (Contraseñas hasheadas PBKDF2)
-- -------------------------------------------------------------
INSERT INTO usuarios (id, rol_id, username, correo, password_hash, salt, estado) VALUES
(1, 1, 'admin', 'admin@clinicamedical.com', 'a3f8901b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f', '1029384756abcdef', 'activo'),
(2, 3, 'dr.mendoza', 'dr.mendoza@clinicamedical.com', 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5', 'abcdef1029384756', 'activo'),
(3, 3, 'dr.perez', 'dr.perez@clinicamedical.com', 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', '5647382910fedcba', 'activo'),
(4, 3, 'dra.arze', 'dra.arze@clinicamedical.com', 'd6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7', '9081726354abcdef', 'activo'),
(5, 2, 'recepcion', 'recepcion@clinicamedical.com', 'e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8', 'fedcba5647382910', 'activo'),
(6, 4, 'paciente.carlos', 'carlos.fernandez@hotmail.com', 'f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9', '1234567890abcdef', 'activo'),
(7, 4, 'paciente.maria', 'maria.lopez@gmail.com', 'a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0', 'abcdef1234567890', 'activo')
ON CONFLICT (correo) DO NOTHING;

-- -------------------------------------------------------------
-- POBLACIÓN DE MÉDICOS
-- -------------------------------------------------------------
INSERT INTO medicos (id, usuario_id, consultorio_id, codigo, matricula_profesional, ci, nombres, apellidos, telefono, correo, estado_operativo) VALUES
(1, 2, 1, 'MED-001', 'MP-4512-BOL', '3489101', 'Carlos', 'Mendoza Villazón', '77218901', 'dr.mendoza@clinicamedical.com', 'activo'),
(2, 3, 2, 'MED-003', 'MP-7821-BOL', '3489102', 'Juan', 'Pérez Sandoval', '70011223', 'dr.perez@clinicamedical.com', 'activo'),
(3, 4, 3, 'MED-009', 'MP-9941-BOL', '3489109', 'Patricia', 'Arze Salinas', '78912340', 'dra.arze@clinicamedical.com', 'activo')
ON CONFLICT (ci) DO NOTHING;

-- Vinculación Médico - Especialidad
INSERT INTO medico_especialidad (medico_id, especialidad_id, activo) VALUES
(1, 1, TRUE), -- Dr. Mendoza -> Cardiología
(2, 9, TRUE), -- Dr. Pérez -> Medicina General
(3, 3, TRUE)  -- Dra. Arze -> Endocrinología
ON CONFLICT (medico_id, especialidad_id) DO NOTHING;

-- Horarios de Atención
INSERT INTO horarios_atencion (medico_id, especialidad_id, consultorio_id, dia_semana, hora_inicio, hora_fin, duracion_bloque_min, estado) VALUES
(1, 1, 1, 'Lunes', '08:00', '12:00', 15, 'activo'),
(1, 1, 1, 'Miércoles', '08:00', '12:00', 15, 'activo'),
(2, 9, 2, 'Lunes', '08:30', '12:30', 15, 'activo'),
(2, 9, 2, 'Viernes', '08:30', '12:30', 15, 'activo'),
(3, 3, 3, 'Lunes', '09:00', '13:00', 15, 'activo')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- POBLACIÓN DE PACIENTES (CU06, CU07)
-- -------------------------------------------------------------
INSERT INTO pacientes (id, usuario_id, codigo, ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion, estado) VALUES
(1, 7, 'PAC-001', '5489123', 'María', 'López Quispe', '1992-04-15', 'F', '77341829', 'maria.lopez@gmail.com', 'Av. Las Américas #450', 'activo'),
(2, 6, 'PAC-002', '6190432', 'Carlos', 'Fernández Rios', '1985-09-22', 'M', '70281930', 'carlos.fernandez@hotmail.com', 'Calle Sucre #120', 'activo')
ON CONFLICT (ci) DO NOTHING;

-- -------------------------------------------------------------
-- ANTECEDENTES MÉDICOS (CU22 - Ficha de Alergias y Patologías)
-- -------------------------------------------------------------
INSERT INTO antecedentes_medicos (paciente_id, grupo_sanguineo, alergias, patologias_cronicas, cirugias_previas, medicacion_habitual, contacto_emergencia_nombre, contacto_emergencia_telefono) VALUES
(1, 'O Positivo (O+)', 'Penicilina y derivados beta-lactámicos', 'Rinitis alérgica estacional', 'Apendicectomía a los 16 años', 'Loratadina 10mg condicional', 'Jorge López', '76118920'),
(2, 'A Positivo (A+)', 'Ninguna conocida', 'Hipertensión arterial estadio 1, Dislipidemia mixta', 'Sin cirugías previas', 'Losartán 50mg / día, Metformina 850mg / día', 'Lucía Rios', '71904421')
ON CONFLICT (paciente_id) DO UPDATE SET
    grupo_sanguineo = EXCLUDED.grupo_sanguineo,
    alergias = EXCLUDED.alergias,
    patologias_cronicas = EXCLUDED.patologias_cronicas,
    medicacion_habitual = EXCLUDED.medicacion_habitual;

-- -------------------------------------------------------------
-- CITAS MÉDICAS HISTÓRICAS Y ACTIVAS (CU13 a CU19)
-- -------------------------------------------------------------
INSERT INTO citas_medicas (id, codigo_cita, paciente_id, medico_id, especialidad_id, consultorio_id, fecha_cita, hora_inicio_bloque, hora_fin_bloque, motivo_consulta, estado_cita) VALUES
-- Consulta previa #1 de Carlos con Dr. Juan Pérez (Medicina General) hace 5 semanas
(1, 'CM-0007', 2, 2, 9, 2, '2026-10-10', '10:00', '10:15', 'Cuadro respiratorio agudo y cefalea pulsátil', 'Atendida'),
-- Consulta previa #2 de Carlos con Dra. Patricia Arze (Endocrinología) hace 3 semanas
(2, 'CM-0009', 2, 3, 3, 3, '2026-10-24', '11:00', '11:15', 'Evaluación metabólica por glucemia elevada y sobrepeso', 'Atendida'),
-- Cita activa próxima de Carlos con Dr. Carlos Mendoza (Cardiología)
(3, 'CM-0002', 2, 1, 1, 1, '2026-11-16', '08:30', '08:45', 'Control de hipertensión y valoración de nuevo tratamiento', 'Confirmada')
ON CONFLICT (codigo_cita) DO NOTHING;

-- -------------------------------------------------------------
-- HISTORIAL CLÍNICO INMUTABLE Y RECETAS PREVIAS (CU20, CU21)
-- -------------------------------------------------------------
-- Lo que recetó el Dr. Juan Pérez hace 5 semanas:
INSERT INTO historial_clinico (
    cita_id, paciente_id, medico_id, presion_arterial, temperatura_c, frecuencia_cardiaca, peso_kg, talla_cm,
    sintomas, anamnesis, diagnostico_principal, tratamiento_receta, fecha_atencion
) VALUES (
    1, 2, 2, '145/95', 37.8, 86, 82.5, 174.0,
    'Odinofagia intensa de 3 días, malestar general y cefalea pulsátil',
    'Paciente masculino de 41 años con cuadro de vías aéreas superiores. En control se evidencia presión arterial elevada en dos tomas.',
    'Faringitis aguda viral + Hipertensión arterial descompensada',
    '1. Paracetamol 500mg: Tomar 1 comprimido cada 8 horas por 4 días si hay fiebre o dolor.
2. Losartán 50mg: Iniciar 1 comprimido cada mañana en ayunas.
3. Reposo relativo 48 horas y abundantes líquidos.
4. DERIVACIÓN PRIORITARIA A CARDIOLOGÍA para valoración de hipertensión y estudio MAPA 24h.',
    '2026-10-10 10:25:00'
) ON CONFLICT (cita_id) DO NOTHING;

-- Lo que recetó la Dra. Patricia Arze hace 3 semanas:
INSERT INTO historial_clinico (
    cita_id, paciente_id, medico_id, presion_arterial, temperatura_c, frecuencia_cardiaca, peso_kg, talla_cm,
    sintomas, anamnesis, diagnostico_principal, tratamiento_receta, fecha_atencion
) VALUES (
    2, 2, 3, '138/88', 36.6, 74, 82.0, 174.0,
    'Evaluación metabólica, fatiga vespertina y sobrepeso leve',
    'Exámenes de laboratorio: Glucemia en ayunas 116 mg/dL, HbA1c 6.1%, Colesterol total 230 mg/dL.',
    'Prediabetes con intolerancia a los carbohidratos y Dislipidemia mixta',
    '1. Metformina 850mg: Tomar 1 comprimido diario junto al almuerzo.
2. Atorvastatina 10mg: 1 comprimido por la noche antes de dormir.
3. Plan alimentario hipocalórico bajo en hidratos refinados y sodio.
4. Mantener Losartán pautado y control conjunto con CARDIOLOGÍA.',
    '2026-10-24 11:30:00'
) ON CONFLICT (cita_id) DO NOTHING;
