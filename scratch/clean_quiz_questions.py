import os

html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

quiz_questions_clean = """      const QUIZ_QUESTIONS = {
        Demographics: {
          main: [
            {
              id: 1,
              question: "Selon la leçon, qu'est-ce que l'explosion démographique dans les pays en développement ?",
              options: {
                A: "Une augmentation rapide de la population due à un fort taux de natalité et une baisse de la mortalité.",
                B: "Un déclin progressif et continu de la population active.",
                C: "Une hausse soudaine et inexpliquée du taux de mortalité infantile.",
                D: "Une migration massive des populations urbaines vers les zones rurales."
              },
              correct: "A"
            },
            {
              id: 2,
              question: "Parmi les facteurs suivants, lequel contribue directement à la hausse de la natalité dans ces pays ?",
              options: {
                A: "Le mariage précoce, l'analphabétisme et le poids des traditions.",
                B: "L'accès universel aux méthodes de contraception moderne.",
                C: "L'industrialisation poussée et l'élévation du niveau de vie.",
                D: "La disparition de la polygamie dans les zones rurales."
              },
              correct: "A"
            },
            {
              id: 3,
              question: "Quel médecin est cité par le professeur pour avoir introduit la méthode de la césarienne afin de limiter la mortalité maternelle ?",
              options: {
                A: "Docteur César",
                B: "Docteur Malthus",
                C: "Docteur Pasteur",
                D: "Docteur Fleming"
              },
              correct: "A"
            },
            {
              id: 4,
              question: "Selon l'analyse démographique présentée dans le cours, quel est le lien entre pauvreté et fécondité ?",
              options: {
                A: "La pauvreté peut encourager l'augmentation des naissances.",
                B: "La pauvreté annule automatiquement toute naissance.",
                C: "Le niveau de vie n'a aucun impact sur la fécondité.",
                D: "La richesse matérielle entraîne une fécondité illimitée."
              },
              correct: "A"
            },
            {
              id: 5,
              question: "Quelle maladie de masse est citée par le professeur comme ayant été freinée grâce aux progrès de la biologie et de la médecine ?",
              options: {
                A: "La tuberculose",
                B: "Le choléra",
                C: "La grippe espagnole",
                D: "Le tétanos"
              },
              correct: "A"
            }
          ],
          alternative: [
            {
              id: 1,
              question: "Quel est l'un des principaux facteurs médicaux de la baisse de la mortalité maternelle après la Seconde Guerre mondiale ?",
              options: {
                A: "La généralisation des césariennes par le Docteur César",
                B: "L'invention du vaccin contre la grippe",
                C: "La hausse des mariages tardifs",
                D: "La réduction de l'agriculture de subsistance"
              },
              correct: "A"
            }
          ]
        },
        Chemistry: {
          main: [
            {
              id: 1,
              question: "Quelle est la formule générale d'un cation d'alkylammonium en chimie organique ?",
              options: {
                A: "R-NH3+",
                B: "R-COOH",
                C: "R-OH",
                D: "R-NH2"
              },
              correct: "A"
            },
            {
              id: 2,
              question: "Comment réagit une amine primaire en milieu acide aqueux pour former son cation d'alkylammonium ?",
              options: {
                A: "L'amine capte un proton H+ cédé par l'eau pour former l'ion alkylammonium R-NH3+.",
                B: "L'amine perd un électron par oxydation directe.",
                C: "L'amine se transforme spontanément en ester.",
                D: "L'amine précipite sous forme d'un produit neutre."
              },
              correct: "A"
            },
            {
              id: 3,
              question: "Dans l'équilibre R-NH3+ + H2O <-> R-NH2 + H3O+, quelle est la relation entre les concentrations des produits ?",
              options: {
                A: "[R-NH2] est rigoureusement égale à [H3O+].",
                B: "[R-NH2] est le double de [H3O+].",
                C: "[H3O+] est toujours nulle à l'équilibre.",
                D: "Les concentrations varient sans aucun rapport."
              },
              correct: "A"
            }
          ],
          alternative: [
            {
              id: 1,
              question: "Quelle est l'expression de la constante d'acidité Ka associée au couple alkylammonium / amine ?",
              options: {
                A: "Ka = ([R-NH2] * [H3O+]) / [R-NH3+]",
                B: "Ka = [R-NH3+] / ([R-NH2] * [H3O+])",
                C: "Ka = [R-NH2] + [H3O+]",
                D: "Ka = [R-NH3+] * [H2O]"
              },
              correct: "A"
            }
          ]
        },
        Economics: {
          main: [
            {
              id: 1,
              question: "Parmi ces institutions internationales, laquelle ne fait pas partie des trois citées par le professeur pour la lutte contre la faim ?",
              options: {
                A: "F.A.O (Food and Agriculture Organization)",
                B: "F.I.D.A (Fonds International de Développement Agricole)",
                C: "O.M.S (Organisation Mondiale de la Santé)",
                D: "P.A.M (Programme Alimentaire Mondial)"
              },
              correct: "C"
            }
          ],
          alternative: [
            {
              id: 1,
              question: "Quelle institution internationale gère le Programme Alimentaire Mondial ?",
              options: {
                A: "F.A.O",
                B: "P.A.M",
                C: "F.I.D.A",
                D: "U.N.E.S.C.O"
              },
              correct: "B"
            }
          ]
        }
      };"""

start_q = txt.find("const QUIZ_QUESTIONS = {")
end_q = txt.find("function getQuizTrackKey() {")
if start_q != -1 and end_q != -1:
    txt = txt[:start_q] + quiz_questions_clean + "\n\n" + txt[end_q:]

open(html_path, 'w', encoding='utf-8').write(txt)
print("Successfully cleaned QUIZ_QUESTIONS in index.html!")
