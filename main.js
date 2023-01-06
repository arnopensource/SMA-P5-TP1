// <reference path="node_modules/@types/p5/global.d.ts" />

const DRAW_TOGGLE = false
const DRAW_DIR = false
const CAN_EAT_THRESHOLD = 10
const COLLISION_THRESHOLD = 1

const NB_AGENTS = 15
const NB_OBSTACLES = 3
const NB_CREEPS = 1000

let env

function setup() {
  createCanvas(windowWidth, windowHeight)
  background(0)
  noStroke()
  fill(0)
  colorMode(HSB)

  env = new Environnement(width, height)
  for (let i = 0; i < NB_AGENTS; i++) {
    env.agents.push(new Agent())
  }
  for (let i = 0; i < NB_OBSTACLES; i++) {
    env.obstacles.push(new Body("obstacle"))
  }
  for (let i = 0; i < NB_CREEPS; i++) {
    env.creeps.push(new Body("creep"))
  }
}

function draw() {
  env.computePerception()
  env.computeDecision()
  env.applyDecision()

  // background(0, 0, 0, 0.1)
  background(0, 0, 0, 1)
  env.draw()

  if (env.agents.length === 1) {
    noLoop()
  }
}

class Environnement {
  constructor(largeur, hauteur) {
    this.largeur = largeur
    this.hauteur = hauteur
    this.agents = []
    this.obstacles = []
    this.creeps = []
  }

  computePerception() {
    for (let agent of this.agents) {
      agent.fustrum.clear()
      for (let other of this.agents) {
        if (agent === other) {
          continue
        }
        if (agent.fustrum.inside(agent.body, other.body)) {
          agent.fustrum.push(other.body)
        }
      }
      for (let obstacle of this.obstacles) {
        if (agent.fustrum.inside(agent.body, obstacle)) {
          agent.fustrum.push(obstacle)
        }
      }
      for (let creep of this.creeps) {
        if (agent.fustrum.inside(agent.body, creep)) {
          agent.fustrum.push(creep)
        }
      }
    }
  }

  computeDecision() {
    for (let agent of this.agents) {
      agent.compute()
    }
  }

  applyDecision() {
    for (let agent of this.agents) {
      agent.body.update()

      if (agent.body.position.x < 0) {
        agent.body.position.x = this.largeur
      } else if (agent.body.position.y < 0) {
        agent.body.position.y = this.hauteur
      } else if (agent.body.position.x > this.largeur) {
        agent.body.position.x = 0
      } else if (agent.body.position.y > this.hauteur) {
        agent.body.position.y = 0
      }

      for (let obstacle of this.obstacles) {
        let collision = agent.body.collide(obstacle)
        if (collision > COLLISION_THRESHOLD) {
          agent.body.vitesse.reflect(p5.Vector.sub(obstacle.position, agent.body.position))
          agent.body.vitesse.normalize()
          agent.body.update(collision)
        }
      }

      this.creeps = this.creeps.filter(creep => {
        if (agent.body.collide(creep)) {
          agent.body.size++
          return false
        }
        return true
      })

      this.agents = this.agents.filter(other => {
        let collision = agent.body.collide(other.body)
        if (collision > COLLISION_THRESHOLD) {
          if (agent.body.size > other.body.size + CAN_EAT_THRESHOLD) {
            agent.body.size += other.body.size
            return false
          } else if (agent.body.size >= other.body.size - CAN_EAT_THRESHOLD) {
            agent.body.vitesse.reflect(p5.Vector.sub(other.body.position, agent.body.position))
            agent.body.vitesse.normalize()
            agent.body.update()
          }
        }
        return true
      })
    }
  }

  draw() {
    for (let creep of this.creeps) {
      creep.draw()
    }
    for (let agent of this.agents) {
      agent.draw()
    }
    for (let obstacle of this.obstacles) {
      obstacle.draw()
    }
  }
}

class Agent {
  constructor() {
    this.body = new Body("agent")
    this.fustrum = new Fustrum()
  }

  compute() {
    let orders = {
      flee: [],
      eat: [],
    }

    for (let body of this.fustrum.perceptionList) {
      let d = p5.Vector.sub(body.position, this.body.position)
      if (body.type === "agent") {
        if (this.body.size > body.size + CAN_EAT_THRESHOLD) {
          orders.eat.push({
            dir: d.normalize(),
            weight: body.size,
            dist: d.mag(),
          })
        } else if (this.body.size <= body.size - CAN_EAT_THRESHOLD) {
          orders.flee.push({
            dir: d.normalize(),
            weight: body.size,
            dist: d.mag(),
          })
        }
      }
      if (body.type === "creep") {
        orders.eat.push({
          dir: d.normalize(),
          weight: 1,
          dist: d.mag(),
        })
      }
    }

    if (orders.flee.length > 0) {
      this.body.vitesse = orders.flee.map(order => order.dir.mult(-1)).reduce((a, b) => a.add(b), createVector(0, 0)).normalize()
    } else if (orders.eat.length > 0) {
      this.body.vitesse = orders.eat.sort((a, b) => {
        return b.weight - a.weight
      })[0].dir
    }
  }

  draw() {
    let bump = false
    for (let body of this.fustrum.perceptionList) {
      if (body.type === "obstacle") {
        let d = p5.Vector.dist(this.body.position, body.position)
        d = d - this.body.size - body.size
        if (d < 0) {
          bump = true
          break
        }
      }
    }

    this.body.draw(this.fustrum, bump)
  }
}

class Body {
  constructor(type) {
    if (type == null) {
      throw new Error("cannot create body : type is null")
    }
    this.type = type

    if (type === "agent") {
      this.size = 20
      this.position = createVector(random(width), random(height))
      this.vitesse = p5.Vector.random2D()
      this.color = color(random(360), 100, 100)
    } else if (type === "obstacle") {
      this.size = random(10, 50)
      this.position = createVector(random(width), random(height))
      this.vitesse = p5.Vector(0, 0)
      this.color = color(0, 0, 100)
    } else if (type === "creep") {
      this.size = 5
      this.position = createVector(random(width), random(height))
      this.vitesse = p5.Vector(0, 0)
      this.color = color(random(360), 100, 100)
    } else {
      throw new Error("cannot create body : unknown type")
    }
  }

  update(n) {
    n = n ?? 1
    for (let i = 0; i < n; i++) {
      this.position.add(this.vitesse)
    }
  }

  draw(fustrum, toggle) {
    if (fustrum != null) {
      this.color.setAlpha(0.1)
      fill(this.color)
      circle(this.position.x, this.position.y, this.size * 2 * fustrum.range)
    }

    this.color.setAlpha(1)
    fill(this.color)
    circle(this.position.x, this.position.y, this.size * 2)

    if (toggle && DRAW_TOGGLE) {
      fill(0)
      circle(this.position.x, this.position.y, this.size)
    }

    if (DRAW_DIR) {
      stroke(255)
      strokeWeight(4)
      line(this.position.x, this.position.y, this.position.x + this.vitesse.x * this.size, this.position.y + this.vitesse.y * this.size)
      noStroke()
    }
  }

  collide(body) {
    let d = p5.Vector.dist(this.position, body.position)
    d = d - this.size - body.size
    if (d >= 0) {
      return 0
    } else {
      return -d
    }
  }
}

class Fustrum {
  constructor() {
    this.range = 3
    this.perceptionList = []
  }

  inside(self, target) {
    let distanceToBorder = p5.Vector.dist(self.position, target.position) - target.size
    let detectionRadius = self.size * this.range
    return distanceToBorder < detectionRadius
  }

  clear() {
    this.perceptionList = []
  }

  push(body) {
    this.perceptionList.push(body)
  }

  draw(color) {

  }
}

function keyPressed() {
  if (key === ' ') {
    if (isLooping()) {
      noLoop()
    } else {
      loop()
    }
  }
}