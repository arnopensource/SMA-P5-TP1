// <reference path="node_modules/@types/p5/global.d.ts" />

let env

function setup() {
  createCanvas(600, 600)
  background(220)  
  noStroke()
  fill(0)
  colorMode(HSB)

  env = new Environnement(600, 600)
  for (let i = 0; i < 100; i++) {
    env.addAgent(new Agent())
  }
}

function draw() {
  env.calculPerceptions()
  env.calculDecisions()
  env.appliqueDecisions()

  background(0, 0, 0, 0.1)
  env.affiche()
}

class Environnement {
  constructor(largeur, hauteur) {
    this.largeur = largeur 
    this.hauteur = hauteur
    this.agents = []
  }

  calculPerceptions() {
    
  }

  calculDecisions() {
    
  }

  appliqueDecisions() {
    for (let agent of this.agents) {
      agent.body.deplacement()
      if (agent.body.position.x < 0) {
        agent.body.position.x = this.largeur
      } else if (agent.body.position.y < 0) {
        agent.body.position.y = this.hauteur
      } else if (agent.body.position.x > this.largeur) {
        agent.body.position.x = 0
      } else if (agent.body.position.y > this.hauteur) {
        agent.body.position.y = 0
      }
    }
  }

  addAgent(agent) {
    this.agents.push(agent)    
  }

  affiche() {
    for (let agent of this.agents) {
      agent.affiche()
    }
  }
}

class Agent {
  constructor() {
    this.body = new Body()
  }

  decision() {
    
  }

  affiche() {
    fill(this.body.color)
    circle(this.body.position.x, this.body.position.y, 5)
  }
}

class Body {
  constructor() {
    this.fustrum = new Fustrum()
    this.position = createVector(width / 2, height / 2)
    this.vitesse = p5.Vector.random2D()
    this.color = color(random(360), 100, 100)
  }

  deplacement() {
    this.position.add(this.vitesse)
  }
}

class Fustrum {
  constructor() {
    this.perceptionList = []
  }

  perception() {
    
  }
}