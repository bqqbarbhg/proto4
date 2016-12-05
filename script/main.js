
var MAPWIDTH = 10;
var MAPHEIGHT = 10;

var map =
[
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 1, 1, 1, 1, 1, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 1, 1, 1, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

var vertShader =
	"precision mediump float;\n" +
	"attribute vec3 position;\n" +
	"attribute vec2 texCoord;\n" +
	"uniform mat4 wvp;\n" +
	"varying vec2 pos;\n" +
	"void main() {\n" +
	"	gl_Position = wvp * vec4(position, 1.0);\n" +
	"	pos = texCoord;\n" +
	"}\n";
var fragShader =
	"precision mediump float;\n" +
	"varying vec2 pos;\n" +
	"uniform sampler2D tex;\n" +
	"uniform float alpha;\n" +
	"void main() {\n" +
	"	vec4 col = texture2D(tex, pos);\n" +
	//"	if (col.a < 0.5) discard;\n" +
	"	col.rgb *= col.a;\n" +
	"	col *= alpha;\n" +
	"	gl_FragColor = col;\n" +
	"}\n";

var entVertShader =
	"precision mediump float;\n" +
	"attribute vec3 position;\n" +
	"attribute vec2 texCoord;\n" +
	"uniform mat4 wvp;\n" +
	"varying vec2 pos;\n" +
	"void main() {\n" +
	"	gl_Position = wvp * vec4(position, 1.0);\n" +
	"	pos = texCoord;\n" +
	"}\n";
var entFragShader =
	"precision mediump float;\n" +
	"varying vec2 pos;\n" +
	"uniform sampler2D tex;\n" +
	"uniform float alpha;\n" +
	"void main() {\n" +
	"	vec4 col = texture2D(tex, pos);\n" +
	//"	if (col.a < 0.5 && dot(col.rgb, col.rgb) < 0.5) discard;\n" +
	//"	col.a = clamp(max(min(dot(col.rgb, col.rgb) * 10.0, 1.0), smoothstep(-10.0, 10.0, col.a)), 0.0, 1.0);\n" +
	"	col.a = smoothstep(0.4, 0.6, col.a);\n" +
	"	col.rgb *= 1.0 - col.a;\n" +
	//"	col.rgb *= col.a < 0.5 ? 1.0 : 0.0;\n" +
	//"	col *= alpha;\n" +
	"	gl_FragColor = col;\n" +
	"}\n";

function createShader(type, source)
{
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		console.log(gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

function linkProgram(shaders)
{
	var program = gl.createProgram();
	for (var i = 0; i < shaders.length; i++)
	{
		gl.attachShader(program, shaders[i]);
	}
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
	{
		console.log(gl.getProgramInfoLog(program));
		return null;
	}
	return program;
}

var vbo, ibo, indexCount;
function createMapGeometry()
{
	var verts = new Float32Array(MAPWIDTH * MAPHEIGHT * 4 * 5 * 4);
	var indices = new Uint16Array(MAPWIDTH * MAPHEIGHT * 6 * 4);

	var vout = 0;
	var iout = 0;

	var sq2 = Math.sqrt(2);

	function outPlane(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, tx)
	{
		var q = vout * 5;
		var h = 0.0;
		verts[q + 0] = ax;
		verts[q + 1] = ay*sq2;
		verts[q + 2] = az*sq2;
		verts[q + 3] = 0.0 + 0.25 * tx+h;
		verts[q + 4] = 1.0-h;
		verts[q + 5] = bx;
		verts[q + 6] = by*sq2;
		verts[q + 7] = bz*sq2;
		verts[q + 8] = 0.25 + 0.25 * tx-h;
		verts[q + 9] = 1.0-h;
		verts[q +10] = cx;
		verts[q +11] = cy*sq2;
		verts[q +12] = cz*sq2;
		verts[q +13] = 0.0 + 0.25 * tx+h;
		verts[q +14] = 0.0+h;
		verts[q +15] = dx;
		verts[q +16] = dy*sq2;
		verts[q +17] = dz*sq2;
		verts[q +18] = 0.25 + 0.25 * tx-h;
		verts[q +19] = 0.0+h;

		indices[iout + 0] = vout;
		indices[iout + 1] = vout + 1;
		indices[iout + 2] = vout + 2;
		indices[iout + 3] = vout + 1;
		indices[iout + 4] = vout + 2;
		indices[iout + 5] = vout + 3;

		vout += 4;
		iout += 6;
	}

	for (var y = 0; y < MAPHEIGHT; y++)
	{
		for (var x = 0; x < MAPWIDTH; x++)
		{
			if (map[x + y * MAPWIDTH] == 1)
			{
				outPlane(x, y+1, 0, x+1, y+1, 0, x, y+1, 1, x+1, y+1, 1, 2);
				if (map[x + y * MAPWIDTH - 1] != 1)
					outPlane(x, y, 0, x, y+1, 0, x, y, 1, x, y+1, 1, 3);
				if (map[x + y * MAPWIDTH + 1] != 1)
					outPlane(x+1, y, 0, x+1, y+1, 0, x+1, y, 1, x+1, y+1, 1, 3);
			}
			else
			{
				outPlane(x, y, 0, x+1, y, 0, x, y+1, 0, x+1, y+1, 0, 0);
			}
		}
	}

	indexCount = iout;

	vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
	ibo = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);	
}

var quadVerts = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadVerts);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		-1, -1, 0, 0, 1,
		1, -1, 0, 1, 1,
		-1, 1, 0, 0, 0,
		1, 1, 0, 1, 0,
	]), gl.STATIC_DRAW);
var quadInds = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadInds);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
		0, 1, 2, 1, 2, 3,
	]), gl.STATIC_DRAW);	

var projection, view, wvp;
var program, entProgram, image, textures = {};

var loadedTextures = 0;

function load()
{
	var textureNames = ["tile/dungeon/tiles", "entity/human/combat", "entity/human/overworld", "entity/skeleton/combat", "entity/skeleton/combat_df", "entity/skeleton/overworld", "shadow"];

	for (var i = 0; i < textureNames.length; i++)
	{
		var image = new Image();

		image.onload = (function(tex, img) { return function() {
			var texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			textures[tex] = texture;

			if (++loadedTextures == textureNames.length)
			{
				setup();
			}
			}})(textureNames[i], image);
		image.src = "data/img/" + textureNames[i] + ".png";
	}
}

function setup()
{
	gl.enable(gl.DEPTH_TEST);

	gl.viewport(0, 0, 640, 480);

	var aspect = (480 / 640);
	projection = mat4.ortho(mat4.create(), -5.0, 5.0, -5.0 * aspect, 5.0 * aspect, 0.001, 100.0);
	view = mat4.lookAt(mat4.create(), [2.5, 2.5*Math.sqrt(2)+10, 10], [2.5, 2.5*Math.sqrt(2), 0], [0, 0, 1]);
	wvp = mat4.multiply(mat4.create(), projection, view);
	//wvp = view;

	program = linkProgram([createShader(gl.VERTEX_SHADER, vertShader), createShader(gl.FRAGMENT_SHADER, fragShader)]);
	entProgram = linkProgram([createShader(gl.VERTEX_SHADER, entVertShader), createShader(gl.FRAGMENT_SHADER, entFragShader)]);
	createMapGeometry();

	window.requestAnimationFrame(render);
}

var t = 0.0;

function render()
{
	t += 1.0 / 60.0;
	var d = 0.2;
	var q = Math.min(Math.max(Math.sin(t*2.0), -d), d) / d * 0.5 + 0.5;
	q = q*q*(3-2*q); // 3*q^2 - 2*q^3

	gl.clearColor(0x64/255, 0x95/255, 0xED/255, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

	var posLoc = gl.getAttribLocation(program, "position");
	var texLoc = gl.getAttribLocation(program, "texCoord");

	var z = 1.0 - q * 0.8;
	var aspect = (480 / 640);
	projection = mat4.ortho(mat4.create(), -10.0*z, 10.0*z, -10.0 * aspect*z, 10.0 * aspect*z, 0.001, 100.0);
	view = mat4.lookAt(mat4.create(), [2.5-q*8.0+q, 2.5*Math.sqrt(2)+10+q, 10.0 - q * 8.0], [2.5+q, 2.5*Math.sqrt(2)+q, q*0.5], [0, 0, 1]);
	wvp = mat4.multiply(mat4.create(), projection, view);

	gl.enableVertexAttribArray(posLoc);
	gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 4*5, 0);
	gl.enableVertexAttribArray(texLoc);
	gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 4*5, 4*3);

	gl.bindTexture(gl.TEXTURE_2D, textures["tile/dungeon/tiles"]);

	gl.useProgram(program);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "wvp"), false, wvp);
	gl.uniform1i(gl.getUniformLocation(program, "tex"), 0);
	gl.uniform1f(gl.getUniformLocation(program, "alpha"), 1.0);

	gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, quadVerts);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadInds);

	gl.enableVertexAttribArray(posLoc);
	gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 4*5, 0);
	gl.enableVertexAttribArray(texLoc);
	gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 4*5, 4*3);

	

	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	gl.bindTexture(gl.TEXTURE_2D, textures["shadow"])

	var wvp2 = mat4.create();
	var qa = q*q;

	var world = mat4.create();

	mat4.translate(world, world, [2.5, 3.8, 0.0]);
	//mat4.rotateX(world, world, Math.PI / 2);
	mat4.scale(world, world, [0.5, Math.SQRT2 * 0.5, 1.0]);
	//mat4.scale(world, world, [1.25, 1.25, 1.0]);
	//mat4.rotateX(world, 90.0);
	mat4.multiply(wvp2, wvp, world);

	gl.useProgram(program);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "wvp"), false, wvp2);
	gl.uniform1i(gl.getUniformLocation(program, "tex"), 0);
	gl.uniform1f(gl.getUniformLocation(program, "alpha"), 0.2 * qa);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

	gl.bindTexture(gl.TEXTURE_2D, textures["shadow"])

	var wvp2 = mat4.create();

	var world = mat4.create();

	mat4.translate(world, world, [4.5, 5.8, 0.0]);
	//mat4.rotateX(world, world, Math.PI / 2);
	mat4.scale(world, world, [0.5, Math.SQRT2 * 0.5, 1.0]);
	//mat4.scale(world, world, [1.25, 1.25, 1.0]);
	//mat4.rotateX(world, 90.0);
	mat4.multiply(wvp2, wvp, world);

	gl.useProgram(program);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "wvp"), false, wvp2);
	gl.uniform1i(gl.getUniformLocation(program, "tex"), 0);
	gl.uniform1f(gl.getUniformLocation(program, "alpha"), 0.2 * qa);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	
	gl.bindTexture(gl.TEXTURE_2D, textures["entity/human/combat"])

	

	var world = mat4.create();

	mat4.translate(world, world, [2.5, 3.8, Math.SQRT2 * 0.43]);
	mat4.rotateZ(world, world, 0.7);
	mat4.rotateX(world, world, Math.PI / 2);
	mat4.scale(world, world, [0.5 - (1.0 - qa) * 0.25, Math.SQRT2 * 0.5, 1.0]);
	//mat4.rotateX(world, 90.0);
	
	mat4.multiply(wvp2, wvp, world);

	gl.useProgram(program);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "wvp"), false, wvp2);
	gl.uniform1i(gl.getUniformLocation(program, "tex"), 0);
	gl.uniform1f(gl.getUniformLocation(program, "alpha"), qa);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

	gl.bindTexture(gl.TEXTURE_2D, textures["entity/human/overworld"])

	var world = mat4.create();

	mat4.translate(world, world, [2.5, 3.8, Math.SQRT2 * 0.5]);
	mat4.rotateX(world, world, Math.PI / 2);
	mat4.scale(world, world, [0.5-qa*0.25, Math.SQRT2 * 0.5, 1.0]);
	mat4.scale(world, world, [1.25, 1.25, 1.0]);
	//mat4.rotateX(world, 90.0);
	mat4.multiply(wvp2, wvp, world);

	gl.useProgram(program);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "wvp"), false, wvp2);
	gl.uniform1i(gl.getUniformLocation(program, "tex"), 0);
	gl.uniform1f(gl.getUniformLocation(program, "alpha"), 1 - qa);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

	gl.bindTexture(gl.TEXTURE_2D, textures["entity/skeleton/combat"])

	var world = mat4.create();

	mat4.translate(world, world, [4.5, 5.8, Math.SQRT2 * 0.43]);
	mat4.rotateZ(world, world, 0.7);
	mat4.rotateX(world, world, Math.PI / 2);
	mat4.scale(world, world, [0.5 - (1.0 - qa) * 0.25, Math.SQRT2 * 0.5, 1.0]);
	mat4.scale(world, world, [-1, 1, 1.0]);
	//mat4.rotateX(world, 90.0);
	var wvp2 = mat4.create();
	mat4.multiply(wvp2, wvp, world);

	gl.useProgram(program);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "wvp"), false, wvp2);
	gl.uniform1i(gl.getUniformLocation(program, "tex"), 0);
	gl.uniform1f(gl.getUniformLocation(program, "alpha"), qa);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

	gl.bindTexture(gl.TEXTURE_2D, textures["entity/skeleton/overworld"])

	var world = mat4.create();

	mat4.translate(world, world, [4.5, 5.8, Math.SQRT2 * 0.5]);
	mat4.rotateX(world, world, Math.PI / 2);
	mat4.scale(world, world, [0.5-qa*0.25, Math.SQRT2 * 0.5, 1.0]);
	mat4.scale(world, world, [1.25, 1.25, 1.0]);
	//mat4.rotateX(world, 90.0);
	mat4.multiply(wvp2, wvp, world);

	gl.useProgram(program);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "wvp"), false, wvp2);
	gl.uniform1i(gl.getUniformLocation(program, "tex"), 0);
	gl.uniform1f(gl.getUniformLocation(program, "alpha"), 1 - qa);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);

	window.requestAnimationFrame(render);	
}

load();

