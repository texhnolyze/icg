let gl;
let program;
const { vec3, mat4 } = glMatrix;

let objects = [];
let posLoc,
  colorLoc,
  modelMatrixLoc,
  viewTranslationMatrixLoc,
  viewRotationMatrixLoc,
  projectionMatrixLoc;

// TODO: 2.4: Führe globale Variablen ein für Werte, die in verschiedenen Funktionen benötigt werden
let modelMatrix, viewTranslationMatrix, viewRotationMatrix, projectionMatrix;
const movementSpeed = 0.02;

let isMouseDown = false;

function main() {
  // Get canvas and setup WebGL context
  const canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");

  // Configure viewport
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.75, 0.8, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // Init shader program via additional function and bind it
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  setupMatrices();
  setupObjects();

  // TODO 2.8: Füge einen Event Listener für Tastatureingaben hinzu
  document.addEventListener("keypress", keyCameraMovementXZ);

  canvas.addEventListener("mousedown", () => (isMouseDown = true));
  canvas.addEventListener("mouseup", () => (isMouseDown = false));
  canvas.addEventListener("mousemove", dragCameraMovementXZ);
  canvas.addEventListener("wheel", scrollCameraMovementZ, true);

  render();
}

function setupMatrices() {
  // Get locations of shader variables
  posLoc = gl.getAttribLocation(program, "vPosition");
  colorLoc = gl.getAttribLocation(program, "vColor");

  // TODO 1.3 + 2.3: Bestimme Locations der Shadervariablen für Model und View Matrix (Siehe Präsenzaufgaben)
  modelMatrixLoc = gl.getUniformLocation(program, "uModelMatrix");
  viewRotationMatrixLoc = gl.getUniformLocation(program, "uViewRotationMatrix");
  viewTranslationMatrixLoc = gl.getUniformLocation(
    program,
    "uViewTranslationMatrix"
  );
  projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

  // TODO 2.5: Erstelle mithilfe der Funktionen aus gl-matrix.js eine initiale View Matrix (fromValues(...))
  // Frontsicht mit Blick auf die xy-Ebene
  const eye = vec3.fromValues(0, 0.4, 3.5);
  const target = vec3.fromValues(0, 0, 0);
  const up = vec3.fromValues(0, 1, 0);
  // Draufsicht mit Blick auf die xz-Ebene
  // eye = vec3.fromValues(0, 4, 0);
  // target = vec3.fromValues(0, 0, 0);
  // up = vec3.fromValues(0, 0, -1);
  viewTranslationMatrix = mat4.create();
  mat4.lookAt(viewTranslationMatrix, eye, target, up);

  viewRotationMatrix = mat4.create();

  projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, 90.0, 2.0, 0.0001, 1000.0);

  // TODO 2.6: Übergebe die initiale View Matrix an den Shader
  updateUniforms();
}

function setupObjects() {
  const island = new Island();

  // TODO 1.5: Erstelle mehrere Baum-/Wolkeninstanzen und einen Fluss
  const treeInFrontLeft = new Tree();
  const treeInFrontRight = new Tree();
  const treeInBackMiddle = new Tree();

  const cloudBehindIsland = new Cloud();
  const cloudOutsideIsland = new Cloud();
  const cloudOverIsland = new Cloud();

  // TODO 1.8: Rufe für jedes Objekt die Methode 'SetModelMatrix(position, orientation, scale)' auf und
  // positioniere das Objekt auf diese Weise auf der Insel
  treeInFrontLeft.setModelMatrix({
    position: [-1, 0.5, 0.5],
    scale: [0.2, 0.2, 0.2],
  });
  treeInFrontRight.setModelMatrix({
    position: [1, 0.5, 0.5],
    orientation: [0, -160, 0],
    scale: [0.2, 0.2, 0.2],
  });
  treeInBackMiddle.setModelMatrix({
    position: [0, 0.8, -2],
    orientation: [0, 60, 0],
    scale: [0.3, 0.3, 0.3],
  });

  cloudBehindIsland.setModelMatrix({
    position: [0, 1.4, -3],
    scale: [0.5, 0.5, 0.5],
  });
  cloudOutsideIsland.setModelMatrix({
    position: [2.3, 1, 0],
    orientation: [0, -90, -50],
    scale: [0.4, 0.5, 0.6],
  });
  cloudOverIsland.setModelMatrix({
    position: [-0.9, 2, 0],
    orientation: [20, 130, 0],
    scale: [0.6, 0.6, 0.6],
  });

  objects.push(
    island,
    treeInFrontLeft,
    treeInFrontRight,
    treeInBackMiddle,
    cloudBehindIsland,
    cloudOutsideIsland,
    cloudOverIsland
  );
}

function render() {
  // Only clear once
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  objects.forEach((o) => o.render());
  updateUniforms();
  requestAnimationFrame(render);
}

function updateUniforms() {
  gl.uniformMatrix4fv(viewTranslationMatrixLoc, false, viewTranslationMatrix);
  gl.uniformMatrix4fv(viewRotationMatrixLoc, false, viewRotationMatrix);
  gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix);
}

// TODO 2.7: Erstelle einen Event-Handler, der anhand von WASD-Tastatureingaben
// die View Matrix anpasst
function keyCameraMovementXZ({ key }) {
  switch (key) {
    case "w":
      translateViewMatrix([0, 0, movementSpeed]);
      break;
    case "s":
      translateViewMatrix([0, 0, -movementSpeed]);
      break;
    case "d":
      translateViewMatrix([-movementSpeed, 0, 0]);
      break;
    case "a":
      translateViewMatrix([movementSpeed, 0, 0]);
      break;
    case "q":
      rotateCameraY(movementSpeed);
      break;
    case "e":
      rotateCameraY(-movementSpeed);
      break;
  }
}

function scrollCameraMovementZ(event) {
  const scrollDirection = Math.sign(-event.deltaY);
  translateViewMatrix([0, 0, scrollDirection * 2 * movementSpeed]);
}

function dragCameraMovementXZ({ movementX, movementY }) {
  if (!isMouseDown) return;
  rotateCameraY(movementX * 0.002);
  translateViewMatrix([0, 0, movementY * 0.002]);
}

function rotateCameraY(angle) {
  mat4.rotateY(viewRotationMatrix, viewRotationMatrix, angle);
}

function translateViewMatrix(translation) {
  mat4.translate(viewTranslationMatrix, viewTranslationMatrix, translation);
}

main();
