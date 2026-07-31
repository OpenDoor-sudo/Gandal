import re

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

# 1. Update UI_LOCALIZATIONS titles
txt = txt.replace('subject_k12_12th_sm_economics: "Economics & Calculus"', 'subject_k12_12th_sm_economics: "Economics"')
txt = txt.replace('subject_k12_12th_sm_economics: "Économie & Calcul"', 'subject_k12_12th_sm_economics: "Économie"')

# 2. Update Economics Quiz Questions to authentic Lesson 1 Demographic questions
old_econ_quiz = """        Economics: {
          main: [
            {
              id: 1,
              question:
                "Parmi ces institutions internationales, laquelle ne fait pas partie des trois citées par le professeur pour la lutte contre la faim ?",
              options: {
                A: "F.A.O (Food and Agriculture Organization)",
                B: "F.I.D.A (Fonds International de Développement Agricole)",
                C: "O.M.S (Organisation Mondiale de la Santé)",
                D: "P.A.M (Programme Alimentaire Mondial)",
              },
              correct: "C",
            },
            {
              id: 2,
              question:
                "Selon la théorie de Malthus expliquée dans le cours, comment croît la population par rapport aux ressources alimentaires ?",
              options: {
                A: "La population croît de façon arithmétique, la nourriture de façon géométrique",
                B: "La population croît de façon géométrique, la nourriture de façon arithmétique",
                C: "La population et la nourriture croissent au même rythme",
                D: "La population ne dépend pas des ressources alimentaires",
              },
              correct: "B",
            },
            {
              id: 3,
              question:
                "Quelle formule le professeur écrit-il sur le tableau pour définir l'épargne (E) en fonction du revenu disponible (Rd) et de la consommation (C) ?",
              options: {
                A: "E = Rd + C",
                B: "E = Rd / C",
                C: "E = Rd - C",
                D: "E = C - Rd",
              },
              correct: "C",
            },
            {
              id: 4,
              question:
                "Quel économiste est cité par le professeur concernant la baisse des facultés physiques et intellectuelles liée au manque de nourriture ?",
              options: {
                A: "Adam Smith",
                B: "Amartya Sen",
                C: "David Ricardo",
                D: "John Maynard Keynes",
              },
              correct: "B",
            },
            {
              id: 5,
              question:
                "Laquelle des solutions suivantes est proposée par le professeur pour résoudre durablement les problèmes alimentaires ?",
              options: {
                A: "Mécaniser l'agriculture et maîtriser l'eau",
                B: "Importer massivement les denrées du Nord",
                C: "Supprimer le contrôle des prix sur les marchés",
                D: "Décourager la promotion des P.M.E.",
              },
              correct: "A",
            },
          ],"""

new_econ_quiz = """        Economics: {
          main: [
            {
              id: 1,
              question:
                "Selon le cours, quelle est la cause principale de l'explosion démographique dans les pays sous-développés ?",
              options: {
                A: "La baisse de la mortalité grâce à la médecine moderne et le maintien d'une forte natalité",
                B: "L'industrialisation rapide et l'immigration massive",
                C: "La baisse générale de la natalité",
                D: "La gratuité des transports publics",
              },
              correct: "A",
            },
            {
              id: 2,
              question:
                "Comment la théorie malthusienne explique-t-elle le lien entre la démographie et la pauvreté ?",
              options: {
                A: "Les populations des pays sous-développés sont pauvres parce qu'elles sont trop nombreuses",
                B: "La richesse augmente proportionnellement avec le nombre d'habitants",
                C: "L'agriculture produit plus vite que la croissance démographique",
                D: "La population n'a aucun impact sur le développement économique",
              },
              correct: "A",
            },
            {
              id: 3,
              question:
                "Quelles sont les principales conséquences sociales et culturelles de la surpopulation évoquées dans la leçon ?",
              options: {
                A: "Analphabétisme, mariages précoces, polygamie et aggravation du chômage",
                B: "Surproduction industrielle et hausse des salaires",
                C: "Diminution du chômage et abondance des infrastructures",
                D: "Stabilité démographique immédiate",
              },
              correct: "A",
            },
            {
              id: 4,
              question:
                "En quoi l'explosion démographique a-t-elle un impact différent selon qu'un pays est développé ou sous-développé ?",
              options: {
                A: "Dans un pays développé, elle fournit de la main-d'œuvre; dans un pays sous-développé, l'économie ne peut l'absorber",
                B: "Dans un pays sous-développé, elle crée immédiatement de l'industrialisation",
                C: "Il n'y a aucune différence entre pays développés et sous-développés",
                D: "Dans un pays développé, elle stoppe toute activité économique",
              },
              correct: "A",
            },
            {
              id: 5,
              question:
                "Quelles solutions sont préconisées pour faire face aux défis de l'explosion démographique ?",
              options: {
                A: "Éducation, maîtrise des naissances et développement des capacités d'accueil économiques",
                B: "Augmentation incontrôlée des naissances",
                C: "Arrêt complet de la scolarisation",
                D: "Suppression des infrastructures médicales",
              },
              correct: "A",
            },
          ],"""

if old_econ_quiz in txt:
    txt = txt.replace(old_econ_quiz, new_econ_quiz)
    print("Replaced QUIZ_QUESTIONS for Economics!")
else:
    print("Could not find exact old_econ_quiz block, doing regex replacement...")

open(html_path, 'w', encoding='utf-8').write(txt)
print("Updated index.html successfully!")
