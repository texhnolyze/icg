let gl;
let program;
let posLoc, colorLoc;

function main() {
  // Get canvas and setup WebGL context
  const canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");

  // Configure viewport
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // Init shader program via additional function and bind it
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Get locations of shader variables
  posLoc = gl.getAttribLocation(program, "vPosition");
  colorLoc = gl.getAttribLocation(program, "vColor");

  // Only clear once
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const island = new Island();
  island.translateY(-1.5);

  const cloud = new Cloud();
  cloud.translateY(4);
  cloud.translateX(2.5);
  cloud.scale(0.8);

  const tree = new Tree();
  tree.translateX(-0.5);
  tree.translateY(0.5);
  tree.scale(0.7);

  const objects = [tree, island, cloud];
  objects.forEach((o) => {
    o.initBuffers();
    o.render();
  });
}

main();
