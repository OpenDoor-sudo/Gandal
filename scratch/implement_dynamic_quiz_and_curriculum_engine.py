import sqlite3
import json

# 1. Initialize video_quiz_mcqs table in vault.db and seed current quiz questions
conn = sqlite3.connect('vault.db')
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS video_quiz_mcqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    is_alternative INTEGER DEFAULT 0
);
""")

# Seed Demographics video
demo_vid = "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"
cur.execute("DELETE FROM video_quiz_mcqs WHERE video_id = ?", (demo_vid,))

demo_qs = [
    (1, "Selon la leçon, qu'est-ce que l'explosion démographique dans les pays en développement ?", "Une augmentation rapide de la population due à un fort taux de natalité et une baisse de la mortalité.", "Un déclin progressif et continu de la population active.", "Une hausse soudaine et inexpliquée du taux de mortalité infantile.", "Une migration massive des populations urbaines vers les zones rurales.", "A", 0),
    (2, "Parmi les facteurs suivants, lequel contribue directement à la hausse de la natalité dans ces pays ?", "Le mariage précoce, l'analphabétisme et le poids des traditions.", "L'accès universel aux méthodes de contraception moderne.", "L'industrialisation poussée et l'élévation du niveau de vie.", "La disparition de la polygamie dans les zones rurales.", "A", 0),
    (3, "Quel médecin est cité par le professeur pour avoir introduit la méthode de la césarienne afin de limiter la mortalité maternelle ?", "Docteur César", "Docteur Malthus", "Docteur Pasteur", "Docteur Fleming", "A", 0),
    (4, "Selon l'analyse démographique présentée dans le cours, quel est le lien entre pauvreté et fécondité ?", "La pauvreté peut encourager l'augmentation des naissances.", "La pauvreté annule automatiquement toute naissance.", "Le niveau de vie n'a aucun impact sur la fécondité.", "La richesse matérielle entraîne une fécondité illimitée.", "A", 0),
    (5, "Quelle maladie de masse est citée par le professeur comme ayant été freinée grâce aux progrès de la biologie et de la médecine ?", "La tuberculose", "Le choléra", "La grippe espagnole", "Le tétanos", "A", 0),
    (1, "Quel est l'un des principaux facteurs médicaux de la baisse de la mortalité maternelle après la Seconde Guerre mondiale ?", "La généralisation des césariennes par le Docteur César", "L'invention du vaccin contre la grippe", "La hausse des mariages tardifs", "La réduction de l'agriculture de subsistance", "A", 1)
]

for q in demo_qs:
    cur.execute("""
    INSERT INTO video_quiz_mcqs (video_id, question_id, question, option_a, option_b, option_c, option_d, correct_option, is_alternative)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (demo_vid, q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7]))

# Seed Chemistry video
chem_vid = "vid_chemistry_organic_chemistry_chemistry"
cur.execute("DELETE FROM video_quiz_mcqs WHERE video_id = ?", (chem_vid,))

chem_qs = [
    (1, "Quelle est la formule générale d'un cation d'alkylammonium en chimie organique ?", "R-NH3+", "R-COOH", "R-OH", "R-NH2", "A", 0),
    (2, "Comment réagit une amine primaire en milieu acide aqueux pour former son cation d'alkylammonium ?", "L'amine capte un proton H+ cédé par l'eau pour former l'ion alkylammonium R-NH3+.", "L'amine perd un électron par oxydation directe.", "L'amine se transforme spontanément en ester.", "L'amine précipite sous forme d'un produit neutre.", "A", 0),
    (3, "Dans l'équilibre R-NH3+ + H2O <-> R-NH2 + H3O+, quelle est la relation entre les concentrations des produits ?", "[R-NH2] est rigoureusement égale à [H3O+].", "[R-NH2] est le double de [H3O+].", "[H3O+] est toujours nulle à l'équilibre.", "Les concentrations varient sans aucun rapport.", "A", 0),
    (1, "Quelle est l'expression de la constante d'acidité Ka associée au couple alkylammonium / amine ?", "Ka = ([R-NH2] * [H3O+]) / [R-NH3+]", "Ka = [R-NH3+] / ([R-NH2] * [H3O+])", "Ka = [R-NH2] + [H3O+]", "Ka = [R-NH3+] * [H2O]", "A", 1)
]

for q in chem_qs:
    cur.execute("""
    INSERT INTO video_quiz_mcqs (video_id, question_id, question, option_a, option_b, option_c, option_d, correct_option, is_alternative)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (chem_vid, q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7]))

conn.commit()
conn.close()

print("Successfully created and seeded video_quiz_mcqs table in vault.db!")
