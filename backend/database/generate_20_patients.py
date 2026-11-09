import json
import os
import hashlib
import binascii

# Let's inspect doctor mapping from initialData
# doc-001: Dr. Carlos Mendoza (Cardiología - esp-cardio)
# doc-002: Dra. Elena Vargas (Dermatología - esp-derma)
# doc-003: Dr. Juan Pérez (Medicina General - esp-medgen)
# doc-004: Dra. Gabriela Castro (Pediatría - esp-pedia)
# doc-005: Dra. Sofía Morales (Ginecología - esp-gineco, Mastología - esp-masto)
# doc-006: Dr. Roberto Siles (Traumatología - esp-trauma)
# doc-007: Dr. Marcelo Ortiz (Oftalmología - esp-oftalmo)
# doc-008: Dr. Fernando Rocha (Urología - esp-uro)
# doc-009: Dra. Patricia Arze (Endocrinología - esp-endo, Nutriología - esp-nutri)
# doc-010: Dr. Andrés Beltrán (Gastroenterología - esp-gastro, Proctología - esp-procto)
# doc-011: Dr. Hugo Céspedes (Neumología - esp-neumo)
# doc-012: Dra. Mariana Suárez (Neurología - esp-neuro)
# doc-013: Dr. Rodrigo Navia (Otorrinolaringología - esp-orl)
# doc-014: Lic. Claudia Torrico (Fisioterapia - esp-fisio)
# doc-015: Lic. Verónica Landívar (Fonoaudiología - esp-fono)
# doc-016: Lic. Daniela Antelo (Psicología - esp-psico)
# doc-017: Dr. Guillermo Hurtado (Psiquiatría - esp-psiquia)
# doc-018: Dra. Roxana Pinto (Reumatología - esp-reuma)
# doc-019: Dr. Alejandro Vaca (Medicina Vascular - esp-medvasc)

print("Preparing patient generator...")
