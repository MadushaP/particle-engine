"use strict";

var maxParticles = 2000000,
  particleSize = 2,
  emissionRate = 30,
  objectSize = 3, // drawSize of emitter
  spreadCon = 80,
  forceConstant = 1.5,
  fade = 0.3,
  gradientMode = false,
  triangleMode = false,
  squareMode = true,
  currentMag = -150,
  pushMag = -350,
  pullMag = 6000,
  mouseBool = true;

//Audio example vars  
var analyser, source, fbc_array = 0, audioPlaying = false;

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


window.addEventListener('resize', resizeCanvas, false);
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();

function switchForce(type) {
  if (type == 'push')
    currentMag = pushMag;
  else if (type == 'pull')
    currentMag = pullMag;
}


function changeParticleSize(size) {
  particleSize = size;
}

function mouseSwitch(status) {
  if (status == 'on')
    mouseBool = true;
  else if (status == 'off') {
    mouseBool = false;

    //fields.pop(); 
    fields[0].position.x = -1;
    fields[0].position.y = -1;
  }
}


function switchParticleMode(shape) {
  switch (shape) {
    case "square":
      if (squareMode)
        return;
      else
        squareMode = true;
      triangleMode = false;
      break;
    case "triangle":
      if (triangleMode)
        return;
      else
        triangleMode = true;
      squareMode = false;
      break;
  }
}

function switchGradient() {
  gradientMode = !gradientMode;

}

function changeSpread(spread) {
  spreadCon = spread;
}

function changeEmission(rate) {
  emissionRate = rate;

}

function changeMaxPart(amount) {
  maxParticles = amount;
}

function forceChange(force) {
  forceConstant = 3.6 - force;
}

var particleColour = 'rgb(26,100,25)';

function switchParticleColour(colour) {
  particleColour = colour;
}

function fadeChange(fadeRate) {
  fade = 1 - fadeRate;
}

function Particle(point, velocity, acceleration) {
  this.position = point || new Vector(0, 0);
  this.velocity = velocity || new Vector(0, 0);
  this.acceleration = acceleration || new Vector(0, 0);
}

Particle.prototype.applyForces = function (fields) {
  // our starting acceleration this frame
  var totalAccelerationX = 0;
  var totalAccelerationY = 0;

  // for each passed field
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];

    // find the distance between the particle and the field
    var differenceX = field.position.x - this.position.x;
    var differenceY = field.position.y - this.position.y;

    // calculate the force
    var force = field.mass / Math.pow(differenceX * differenceX + differenceY * differenceY, forceConstant);

    // add to the total acceleration the force adjusted by distance
    totalAccelerationX += differenceX * force;
    totalAccelerationY += differenceY * force;
  }

  // update our particle's acceleration
  this.acceleration = new Vector(totalAccelerationX, totalAccelerationY);
};

Particle.prototype.move = function () {
  this.velocity.add(this.acceleration);
  this.position.add(this.velocity);
};

function Field(point, mass) {
  this.position = point;
  this.setMass(mass);
}

Field.prototype.setMass = function (mass) {
  this.mass = mass || 100;
  this.drawColor = mass < 0 ? "#f00" : "#0f0";
}

function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Vector.prototype.add = function (vector) {
  this.x += vector.x;
  this.y += vector.y;
}

Vector.prototype.getMagnitude = function () {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vector.prototype.getAngle = function () {
  return Math.atan2(this.y, this.x);
};

Vector.fromAngle = function (angle, magnitude) {
  return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};

function Emitter(point, velocity, spread) {
  this.position = point; // Vector
  this.velocity = velocity; // Vector
  this.spread = spread || Math.PI / 32; // possible angles = velocity +/- spread
  this.drawColor = "#ffff00"; // So we can tell them apart from Fields later
}

Emitter.prototype.emitCurrentParticle = function () {
  // Use an angle randomized over the spread so we have more of a "spray"
  var angle = this.velocity.getAngle() + this.spread - (Math.random() * this.spread * spreadCon);


  //Set magnitude, pos, and velocity.
  var magnitude = this.velocity.getMagnitude();
  var position = new Vector(this.position.x, this.position.y);
  var velocity = Vector.fromAngle(angle, magnitude);

  // return our new Particle!
  return new Particle(position, velocity);
};

function spawnParticles() {
  // if we're at our max, stop emitting.
  if (particles.length > maxParticles) return;

  // for each emitter
  for (var i = 0; i < emitters.length; i++) {

    // emit [emissionRate] particles and store them in our particles array
    for (var j = 0; j < emissionRate; j++) {
      particles.push(emitters[i].emitCurrentParticle());
    }

  }
}

function plotParticles(boundsX, boundsY) {
  // a new array to hold particles within our bounds
  var currentParticles = [];

  for (var i = 0; i < particles.length; i++) {
    var particle = particles[i];
    var pos = particle.position;

    // If we're out of bounds, drop this particle and move on to the next
    if (pos.x < 0 || pos.x > boundsX || pos.y < 0 || pos.y > boundsY) continue;

    // Apply forces to particles
    particle.applyForces(fields);

    // Move our particles
    particle.move();

    // Add this particle to the list of current particles
    currentParticles.push(particle);
  }

  // Update our global particles reference
  particles = currentParticles;
}

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

function drawParticles() {
  ctx.fillStyle = particleColour;
  for (var i = 0; i < particles.length; i++) {
    var position = particles[i].position;
    //position.y = fbc_array[i];
    if (audioPlaying) {

      // position.x -= 10  ;
      position.y = -fbc_array[i] + 450;

      if (position.x > window.innerWidth || position.x < 0) {
        position.x = window.innerWidth / 2
      }


      if (position.y <= 450 && position.y >= 400) {
        position.y = + 20
      }

    }
    //Select if gradient mode affected  
    if (!gradientMode) {
      // console.log(count);
      if (squareMode) {

        ctx.fillRect(position.x, position.y, particleSize, particleSize);
      }
      else
        if (triangleMode) {
          // Filled triangle
          ctx.beginPath();
          ctx.moveTo(position.x, position.y);
          ctx.lineTo(10 + position.x, + position.y);
          ctx.lineTo(2 + position.x, 10 + position.y);
          ctx.fill();

          // Stroked triangle
          ctx.beginPath();
          ctx.moveTo(position.x, position.y);
          ctx.lineTo(position.x + 12, position.y + 4);
          ctx.lineTo(position.x + 4, position.y + 12);
          ctx.closePath();
          ctx.stroke();
        }
    }
    else {
      var my_gradient = ctx.createLinearGradient(0, 0, 0, 500);
      my_gradient.addColorStop(0.1, "red");
      my_gradient.addColorStop(1, "yellow");
      ctx.fillStyle = my_gradient;
      ctx.fillRect(position.x, position.y, particleSize, particleSize);
    }
  }
}

function drawCircle(object) {
  ctx.fillStyle = object.drawColor;
  ctx.beginPath();
  ctx.arc(object.position.x, object.position.y, objectSize, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

var particles = [];
var midX = canvas.width / 2;
var midY = canvas.height / 2;

var emitters = [new Emitter(new Vector(midX, midY), Vector.fromAngle(0, 2))];
var fields = [new Field(new Vector(midX + 150, midY - 20), currentMag)];
/////////MAIN LOOP///////////////////////////////////
function loop() {
  clear();
  update();
  draw();
  queue();

  if (audioPlaying) {
    //Array holding the representation of sound frequence

    fbc_array = new Uint8Array(analyser.frequencyBinCount);
    //get byte frequence data
    analyser.getByteFrequencyData(fbc_array);
  }
}

function clear() {
  ctx.fillStyle = 'rgba(0,0,0,' + fade + ')';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function update() {
  spawnParticles();
  plotParticles(canvas.width, canvas.height);
}

function draw() {
  drawParticles();
  fields.forEach(drawCircle);
  emitters.forEach(drawCircle);
}

function queue() {
  window.requestAnimationFrame(loop);
}

loop();

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();

  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

/////////////Event listeners///////////////
var currentMousX;
var currentMousY;

//Move force along with the mouse
canvas.addEventListener('mousemove', function (evt) {
  if (mouseBool) {
    var mousePos = getMousePos(canvas, evt);

    fields[0].position.x = mousePos.x;
    fields[0].position.y = mousePos.y;

    fields[0].setMass(currentMag);

    //Update current position
    currentMousX = mousePos.x;
    currentMousY = mousePos.y;
  }

}, false);

//add new field when mouse pressed
canvas.addEventListener('click', function (evt) {
  var mousePos = getMousePos(canvas, evt);

  fields.push(new Field(new Vector(mousePos.x, mousePos.y), currentMag))
}, false);

window.addEventListener("keypress", function (evt) {
  emitters.push(new Emitter(new Vector(currentMousX, currentMousY), Vector.fromAngle(0, 2)));
}, false);

////////Demo Scripts//////////////
function scriptLoad(exampleNum) {
  switch (exampleNum) {
    case 1:

      //Clear fields and emmiters
      for (var i = 1; i < fields.length; i++) {
        fields.pop();
      }

      for (var i = 0; i < emitters.length; i++) {
        emitters.pop();
      }

      emitters.push(new Emitter(new Vector(200, 500), Vector.fromAngle(0, 2)));
      gradientMode = true;
      spreadCon = 1;
      emissionRate = 15;
      fields.push(new Field(new Vector(400, 300), 1000))
      fields.push(new Field(new Vector(700, 300), 1000))
      break;

    case 2:
      //Clear fields and emmiters
      for (var i = 0; i < fields.length; i++) {
        fields.pop();
      }

      for (var i = 0; i < emitters.length; i++) {
        emitters.pop();
      }

      spreadCon = 6.9;
      fade = 0.2;
      emitters.push(new Emitter(new Vector(200, 500), Vector.fromAngle(0, 2)));
      fields.push(new Field(new Vector(500, 450), -200))
      fields.push(new Field(new Vector(600, 400), 1000))
      break;

    case 3:
      audioPlaying = true;

      //Clear fields and emmiters
      for (var i = 0; i < fields.length + 1; i++) {
        fields.pop();
      }

      for (var i = 0; i < emitters.length; i++) {
        emitters.pop();
      }

      var audio = new Audio();
      audio.src = "dd.mp3";
      audio.controls = false;
      audio.loop = false;
      audio.autoplay = true;

      //Create new object audio instance
      context = new AudioContext();
      gradientMode = true;

      //Create analyser on context
      analyser = context.createAnalyser();

      particleSize = 5;
      //Pass audio into create media method
      source = context.createMediaElementSource(audio);

      //run connect method  on analyser and context
      source.connect(analyser);
      analyser.connect(context.destination);
      break;
  }
}

var input = [[24, 1], [4358, 754], [305, 794]];

for (var i = 0; i < input.length; i++) {
  var currentCase = input[i].toString().split("").reverse().join("");
}
