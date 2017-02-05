"use strict";

var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var colors = [];

var rotate_y = 0;
var x=0;
var y=0;
var z=-30;

var rotate_degree=0;
var axis = 0;
var theta = [ 0, 0, 0 ];
var vColor;

var model_transform_loc;
var projection_matrix_loc;
var fovy = 70;
var aspect_ratio = 1.67;
var near = 0.1;
var far = 100;
var view_transform;
var eye = vec3(0,0,-30);
var at = vec3(0,0,0);
var up = vec3(0,1,0);
var projection_matrix;
var crosshair_flag = false;

var move_cube = [
vec3(10.0, 10.0, 10.0),
vec3(10.0, 10.0, -10.0),
vec3(10.0, -10.0, 10.0),
vec3(-10.0, 10.0, 10.0),
vec3(-10.0, -10.0, 10.0),
vec3(-10.0, 10.0, -10.0),
vec3(10.0, -10.0, -10.0),
vec3(-10.0, -10.0, -10.0)
];

var cube_colors = [
        [ 0.5, 0.5, 0.5, 1.0 ],
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 0.3, 0.7, 0.4, 1.0 ],
        [ 1.0, 1.0, 1.0, 1.0 ],  //white
        [ 0.0, 0.0, 0.0, 1.0 ]   //black

];


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();
    points.push(vec4(-0.3,0,1,1));
    points.push(vec4(0.3,0,1,1));
    points.push(vec4(0,-0.5,1,1));
    points.push(vec4(0,0.5,1,1)); 
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    vColor = gl.getUniformLocation( program, "vColor" );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );


   model_transform_loc = gl.getUniformLocation(program,"model_transform");
   projection_matrix_loc = gl.getUniformLocation(program,"projection");
    //event listeners for buttons
    view_transform = lookAt(eye,at,up);
    render();
    window.onkeydown = function(e)
    {
        var key = e.keyCode ? e.keyCode : e.which;
        if (key == 67) //user pressed c
        {
            change_color();
        }
        else if (key == 38) // user pressed up
        {
            y -= 0.25;
        }
        else if (key == 40) // user pressed down
        {
            y += 0.25;
        }
        else if (key == 37) // user pressed left
        {
            rotate_y +=4;
        }
        else if (key == 39) //user pressed right
        {
            rotate_y -=4
        }
        else if (key == 73) //user pressed i/foward 
        {
            z -= 0.25*Math.cos(radians(rotate_y));
            x += 0.25*Math.sin(radians(rotate_y));
        }
        else if (key == 74) //user pressed j/left
        {
            z -= 0.25*Math.sin(radians(rotate_y));
            x -= 0.25*Math.cos(radians(rotate_y));
        }
        else if (key == 75) //user pressed k/right
        {
            z += 0.25*Math.sin(radians(rotate_y));
            x += 0.25*Math.cos(radians(rotate_y));
        }
        else if (key == 77) //user pressed m/backward
        {
            z += 0.25*Math.cos(radians(rotate_y));
            x -= 0.25*Math.sin(radians(rotate_y));
        }
        else if (key == 82) //user pressed r/reset
        {
             fovy = 80.0;
             aspect_ratio = 5/3;
             rotate_y=0;
             x=0;
             y=0;
             z=-30;
            view_transform = lookAt(eye, at, up);
            projection_matrix = perspective (fovy, aspect_ratio, 0.1, 100);
            crosshair_flag =false;
        }
        else if (key == 78) //user pressed n/narrower
        {
            fovy --;
        }
        else if (key == 87) //user pressed w/wider
        {
            fovy ++;
        }
        else if (key == 187 && e.shiftKey) //user pressed +/crosshair
        {
            crosshair_flag=!crosshair_flag;
        }
    }
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d)
{
    var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push( vertexColors[indices[1]] );


    }
     indices = [ a, b, b, c, c, d, d, a ];
     for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );

    }

}
 var sca =1;
 var trend = true;
function render()
{   //constantly scaling
    if (trend) {
        sca -=0.01;
    }
    else
        sca +=0.01;
    if (sca <=0.8) {trend = false;}
    if (sca >=1.2) {trend = true;}

    //apply projection matrix
    projection_matrix = perspective(fovy,aspect_ratio,near,far);
    projection_matrix = mult(projection_matrix,quaternion(rotate_y));
    gl.uniformMatrix4fv(projection_matrix_loc,false,flatten(projection_matrix));
    
    //rotate at 20rpm
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rotate_degree -= 3.6;

    //draw cubes
    for (var i=0;i<8;i++)
   { var cube = mat4();
    cube = mult(cube,view_transform);
    cube = mult(cube,translate(vec3(x,y,z+30)));
    cube = mult(cube,translate(move_cube[i]));
    cube = mult(cube,rotate(rotate_degree,[1,0,0]));
    cube = mult(cube,scalem(sca,sca,sca));
    gl.uniform4fv(vColor,cube_colors[i]);
    gl.uniformMatrix4fv(model_transform_loc,false,flatten(cube));

    //first six points in every fourteen points are for cube sides
    for(var j=0;j<84;j+=14)
    gl.drawArrays( gl.TRIANGLES, j, 6);
    
    //next eight points in every fourteen points are for cube lines
    for(var k=6;k<84;k+=14)
    {   
        gl.uniform4fv(vColor,flatten([1.0,1.0,1.0,1.0]));

        gl.drawArrays( gl.LINES, k, 8);}
    }
    
    //draw crosshair
    if (crosshair_flag)
    {var crosshair_matrix = mat4();
    crosshair_matrix = mult(crosshair_matrix,ortho(-4.0,4.0,-4.0,4.0,-4.0,4.0));
    gl.uniformMatrix4fv(model_transform_loc,false,flatten(crosshair_matrix));
    gl.uniformMatrix4fv(projection_matrix_loc,false,flatten(mat4()));
    gl.uniform4fv(vColor,flatten([1.0,1.0,1.0,1.0]));
    gl.drawArrays(gl.LINES,84,4);}

    requestAnimFrame( render );

}

//change colors by rotating first eight colors in the array
function change_color()
{
    var temp = cube_colors[0];
    for (var i = 0; i <7; i++) {
        cube_colors[i]=cube_colors[i+1];
    }
    cube_colors[7]=temp;
}

function quaternion(theta)
{
   var cosine= Math.cos(radians(theta));
   var sine=Math.sin(radians(theta));
   var half_cosine= Math.cos(radians(theta/2));
   var half_sine=Math.sin(radians(theta/2));
   var half_sine_square = Math.pow(half_sine,2);
   var product = half_sine * half_cosine;
   //applying the matrix on the book
   //rotation vector (0,1,0)
   var result = mat4(
    vec4(1-2*half_sine_square,0,
        0-2*product,0),
    vec4(0,1,
        0,0),
    vec4(2*product,0,
        1-2*half_sine_square,0),
    vec4(0,0,0,1)

    );
   return result;
}
