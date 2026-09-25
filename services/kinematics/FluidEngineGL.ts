export class FluidEngineGL {
    public gl: WebGL2RenderingContext | WebGLRenderingContext;
    public ext: any;
    public programs: any = {};
    public bloom: any;
    public bloomFbos: any[] = [];
    public sunraysFbo: any;
    public sunraysTempFbo: any;
    public fbos: any = {};
    public blit: any;
    public initialized: boolean = false;

    constructor(gl: WebGL2RenderingContext | WebGLRenderingContext) {
        this.gl = gl;
        this.init();
    }

    private init() {
        const gl = this.gl as any;
        const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

        function getExtension(name: string) {
            return gl.getExtension(name) || gl.getExtension('WEBKIT_' + name) || gl.getExtension('MOZ_' + name);
        }

        function getHalfFloatTexType() {
            const ext = getExtension('OES_texture_half_float');
            if (ext) return ext.HALF_FLOAT_OES;
            return gl.HALF_FLOAT;
        }

        function supportRenderTextureFormat(internalFormat: number, format: number, type: number) {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            return status === gl.FRAMEBUFFER_COMPLETE;
        }

        function getSupportedFormat(internalFormat: number, format: number, type: number): any {
            if (!supportRenderTextureFormat(internalFormat, format, type)) {
                switch (internalFormat) {
                    case (gl as any).R16F: return getSupportedFormat((gl as any).RG16F, (gl as any).RG, type);
                    case (gl as any).RG16F: return getSupportedFormat((gl as any).RGBA16F || gl.RGBA, gl.RGBA, type);
                    default: 
                        if (type !== gl.UNSIGNED_BYTE) {
                            return getSupportedFormat(gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);
                        }
                        return { internalFormat: gl.RGBA, format: gl.RGBA };
                }
            }
            return { internalFormat, format };
        }

        let halfFloatTexType: number;
        let supportLinearFiltering: any;

        if (isWebGL2) {
            getExtension('EXT_color_buffer_float');
            supportLinearFiltering = getExtension('OES_texture_float_linear');
            halfFloatTexType = gl.HALF_FLOAT;
        } else {
            halfFloatTexType = getHalfFloatTexType();
            supportLinearFiltering = getExtension('OES_texture_half_float_linear');
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        this.ext = {
            formatRGBA: isWebGL2 ? getSupportedFormat(gl.RGBA16F, gl.RGBA, halfFloatTexType) : getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType),
            formatRG:   isWebGL2 ? getSupportedFormat(gl.RG16F, gl.RG, halfFloatTexType)     : getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType),
            formatR:    isWebGL2 ? getSupportedFormat(gl.R16F, gl.RED, halfFloatTexType)      : getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType),
            halfFloatTexType,
            supportLinearFiltering
        };

        // ── BLIT: quad buffers initialized ONCE (Pavel's IIFE pattern) ──
        const vao = isWebGL2 ? gl.createVertexArray() : null;
        if (vao) gl.bindVertexArray(vao);

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        
        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        if (vao) gl.bindVertexArray(null);

        this.blit = (target: any, clear: boolean = false) => {
            if (vao) {
                gl.bindVertexArray(vao);
            } else {
                gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(0);
            }

            if (target == null) {
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            } else {
                gl.viewport(0, 0, target.width, target.height);
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
            }
            if (clear) {
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

            if (vao) gl.bindVertexArray(null);
        };

        // ── PROGRAM CLASS ──
        class Program {
            public program: WebGLProgram;
            public uniforms: Record<string, WebGLUniformLocation> = {};

            constructor(vertexShaderStr: string, fragmentShaderStr: string) {
                this.program = this.createProgram(vertexShaderStr, fragmentShaderStr);
                const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
                for (let i = 0; i < uniformCount; i++) {
                    const uniformName = gl.getActiveUniform(this.program, i).name;
                    this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName) as WebGLUniformLocation;
                }
            }

            bind() { gl.useProgram(this.program); }

            private compileShader(type: number, source: string) {
                const shader = gl.createShader(type)!;
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.trace(gl.getShaderInfoLog(shader));
                return shader;
            }

            private createProgram(vertexSource: string, fragmentSource: string) {
                const program = gl.createProgram()!;
                gl.attachShader(program, this.compileShader(gl.VERTEX_SHADER, vertexSource));
                gl.attachShader(program, this.compileShader(gl.FRAGMENT_SHADER, fragmentSource));
                gl.bindAttribLocation(program, 0, 'aPosition');
                gl.linkProgram(program);
                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.trace(gl.getProgramInfoLog(program));
                return program;
            }
        }

        // ── FBO CLASSES ──
        class FBO {
            public texture: WebGLTexture;
            public fbo: WebGLFramebuffer;
            public width: number;
            public height: number;
            public texelSizeX: number;
            public texelSizeY: number;

            constructor(w: number, h: number, internalFormat: number, format: number, type: number, param: number) {
                gl.activeTexture(gl.TEXTURE0);
                this.texture = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

                this.fbo = gl.createFramebuffer()!;
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
                gl.viewport(0, 0, w, h);
                gl.clear(gl.COLOR_BUFFER_BIT);

                this.width = w;
                this.height = h;
                this.texelSizeX = 1.0 / w;
                this.texelSizeY = 1.0 / h;
            }

            attach(id: number) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                return id;
            }
        }

        class DoubleFBO {
            public width: number;
            public height: number;
            public texelSizeX: number;
            public texelSizeY: number;
            private fbo1: FBO;
            private fbo2: FBO;

            constructor(w: number, h: number, internalFormat: number, format: number, type: number, param: number) {
                this.fbo1 = new FBO(w, h, internalFormat, format, type, param);
                this.fbo2 = new FBO(w, h, internalFormat, format, type, param);
                this.width = w;
                this.height = h;
                this.texelSizeX = 1.0 / w;
                this.texelSizeY = 1.0 / h;
            }

            get read() { return this.fbo1; }
            get write() { return this.fbo2; }

            swap() {
                const temp = this.fbo1;
                this.fbo1 = this.fbo2;
                this.fbo2 = temp;
            }
        }

        // ── VERTEX SHADERS ──
        // baseVertexShader: outputs vL/vR/vT/vB for neighbor sampling
        const baseVertexShader = `
            precision highp float;
            attribute vec2 aPosition;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform vec2 texelSize;
            void main () {
                vUv = aPosition * 0.5 + 0.5;
                vL = vUv - vec2(texelSize.x, 0.0);
                vR = vUv + vec2(texelSize.x, 0.0);
                vT = vUv + vec2(0.0, texelSize.y);
                vB = vUv - vec2(0.0, texelSize.y);
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }`;

        // blurVertexShader: Pavel's is 1D-only (vL/vR), used for the separable Gaussian blur
        const blurVertexShader = `
            precision highp float;
            attribute vec2 aPosition;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            uniform vec2 texelSize;
            void main () {
                vUv = aPosition * 0.5 + 0.5;
                float offset = 1.33333333;
                vL = vUv - texelSize * offset;
                vR = vUv + texelSize * offset;
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }`;

        // ── FRAGMENT SHADERS ──

        // clearShader: multiplies existing pressure by 'value' (0–1) — NOT a hard clear
        this.programs.clear = new Program(baseVertexShader, `
            precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            uniform sampler2D uTexture;
            uniform float value;
            void main () {
                gl_FragColor = value * texture2D(uTexture, vUv);
            }`);

        // blurShader: separable Gaussian using vL/vR from blurVertexShader
        this.programs.blur = new Program(blurVertexShader, `
            precision mediump float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            uniform sampler2D uTexture;
            void main () {
                vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
                sum += texture2D(uTexture, vL) * 0.35294117;
                sum += texture2D(uTexture, vR) * 0.35294117;
                gl_FragColor = sum;
            }`);

        this.programs.splat = new Program(baseVertexShader, `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            uniform sampler2D uTarget;
            uniform float aspectRatio;
            uniform vec3 color;
            uniform vec2 point;
            uniform float radius;
            void main () {
                vec2 p = vUv - point.xy;
                p.x *= aspectRatio;
                vec3 splat = exp(-dot(p, p) / radius) * color;
                vec3 base = texture2D(uTarget, vUv).xyz;
                gl_FragColor = vec4(base + splat, 1.0);
            }`);

        this.programs.advection = new Program(baseVertexShader, `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform vec2 dyeTexelSize;
            uniform float dt;
            uniform float dissipation;
            void main () {
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                vec4 result = texture2D(uSource, coord);
                float decay = 1.0 + dissipation * dt;
                gl_FragColor = result / decay;
            }`);

        this.programs.divergence = new Program(baseVertexShader, `
            precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            varying highp vec2 vL;
            varying highp vec2 vR;
            varying highp vec2 vT;
            varying highp vec2 vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).x;
                float R = texture2D(uVelocity, vR).x;
                float T = texture2D(uVelocity, vT).y;
                float B = texture2D(uVelocity, vB).y;
                vec2 C = texture2D(uVelocity, vUv).xy;
                if (vL.x < 0.0) { L = -C.x; }
                if (vR.x > 1.0) { R = -C.x; }
                if (vT.y > 1.0) { T = -C.y; }
                if (vB.y < 0.0) { B = -C.y; }
                float div = 0.5 * (R - L + T - B);
                gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
            }`);

        this.programs.curl = new Program(baseVertexShader, `
            precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            varying highp vec2 vL;
            varying highp vec2 vR;
            varying highp vec2 vT;
            varying highp vec2 vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).y;
                float R = texture2D(uVelocity, vR).y;
                float T = texture2D(uVelocity, vT).x;
                float B = texture2D(uVelocity, vB).x;
                float vorticity = R - L - T + B;
                gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
            }`);

        this.programs.vorticity = new Program(baseVertexShader, `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            uniform sampler2D uCurl;
            uniform float curl;
            uniform float dt;
            void main () {
                float L = texture2D(uCurl, vL).x;
                float R = texture2D(uCurl, vR).x;
                float T = texture2D(uCurl, vT).x;
                float B = texture2D(uCurl, vB).x;
                float C = texture2D(uCurl, vUv).x;
                vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
                force /= length(force) + 0.0001;
                force *= curl * C;
                force.y *= -1.0;
                vec2 velocity = texture2D(uVelocity, vUv).xy;
                velocity += force * dt;
                velocity = min(max(velocity, -1000.0), 1000.0);
                gl_FragColor = vec4(velocity, 0.0, 1.0);
            }`);

        this.programs.pressure = new Program(baseVertexShader, `
            precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            varying highp vec2 vL;
            varying highp vec2 vR;
            varying highp vec2 vT;
            varying highp vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uDivergence;
            void main () {
                float L = texture2D(uPressure, vL).x;
                float R = texture2D(uPressure, vR).x;
                float T = texture2D(uPressure, vT).x;
                float B = texture2D(uPressure, vB).x;
                float divergence = texture2D(uDivergence, vUv).x;
                float pressure = (L + R + B + T - divergence) * 0.25;
                gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
            }`);

        this.programs.gradientSubtract = new Program(baseVertexShader, `
            precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            varying highp vec2 vL;
            varying highp vec2 vR;
            varying highp vec2 vT;
            varying highp vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uPressure, vL).x;
                float R = texture2D(uPressure, vR).x;
                float T = texture2D(uPressure, vT).x;
                float B = texture2D(uPressure, vB).x;
                vec2 velocity = texture2D(uVelocity, vUv).xy;
                velocity.xy -= vec2(R - L, T - B);
                gl_FragColor = vec4(velocity, 0.0, 1.0);
            }`);

        this.programs.bloomPrefilter = new Program(baseVertexShader, `
            precision mediump float;
            precision mediump sampler2D;
            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform vec3 curve;
            uniform float threshold;
            void main () {
                vec3 c = texture2D(uTexture, vUv).rgb;
                float br = max(c.r, max(c.g, c.b));
                float rq = clamp(br - curve.x, 0.0, curve.y);
                rq = curve.z * rq * rq;
                c *= max(rq, br - threshold) / max(br, 0.0001);
                gl_FragColor = vec4(c, 0.0);
            }`);

        // bloomBlur uses base vertex (vL/vR/vT/vB) for the downsample/upsample passes
        this.programs.bloomBlur = new Program(baseVertexShader, `
            precision mediump float;
            precision mediump sampler2D;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uTexture;
            void main () {
                vec4 sum = vec4(0.0);
                sum += texture2D(uTexture, vL);
                sum += texture2D(uTexture, vR);
                sum += texture2D(uTexture, vT);
                sum += texture2D(uTexture, vB);
                sum *= 0.25;
                gl_FragColor = sum;
            }`);

        this.programs.bloomFinal = new Program(baseVertexShader, `
            precision mediump float;
            precision mediump sampler2D;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uTexture;
            uniform float intensity;
            void main () {
                vec4 sum = vec4(0.0);
                sum += texture2D(uTexture, vL);
                sum += texture2D(uTexture, vR);
                sum += texture2D(uTexture, vT);
                sum += texture2D(uTexture, vB);
                sum *= 0.25;
                gl_FragColor = sum * intensity;
            }`);

        this.programs.sunraysMask = new Program(baseVertexShader, `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            uniform sampler2D uTexture;
            void main () {
                vec4 c = texture2D(uTexture, vUv);
                float br = max(c.r, max(c.g, c.b));
                c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
                gl_FragColor = c;
            }`);

        // sunrays reads .a channel (set by sunraysMask), marches toward center
        this.programs.sunrays = new Program(baseVertexShader, `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform float weight;
            #define ITERATIONS 16
            void main () {
                float Density = 0.3;
                float Decay = 0.95;
                float Exposure = 0.7;
                vec2 coord = vUv;
                vec2 dir = vUv - 0.5;
                dir *= 1.0 / float(ITERATIONS) * Density;
                float illuminationDecay = 1.0;
                float color = texture2D(uTexture, vUv).a;
                for (int i = 0; i < ITERATIONS; i++) {
                    coord -= dir;
                    float col = texture2D(uTexture, coord).a;
                    color += col * illuminationDecay * weight;
                    illuminationDecay *= Decay;
                }
                gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
            }`);

        // display: Enhanced liquid shading with normal specular refraction, ACES HDR tonemapping, and optional Kaleidoscope folding
        this.programs.display = new Program(baseVertexShader, `
            precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uTexture;
            uniform sampler2D uBloom;
            uniform sampler2D uSunrays;
            uniform vec2 texelSize;
            uniform float uShading;
            uniform float uBloomEnabled;
            uniform float uSunraysEnabled;
            uniform vec3 uBackColor;
            uniform float uTransparent;
            uniform float uKaleidoscope;
            uniform vec2  uCenter;
            uniform float uAspect;
            uniform float uVortexRotation;
            uniform float uSaturation;
            uniform float uMasterOpacity;

            // Sonoluminescence (Acoustic Cavitation & Bremsstrahlung) uniforms
            uniform float u_binauralHz;
            uniform float u_vanDerWaalsCore;
            uniform float u_bremsstrahlungGlow;
            uniform float u_audioEnergy;
            uniform float u_time;
            uniform vec3  u_coreColor;
            uniform vec3  u_rimColor;
            uniform vec3  u_glowColor;
            uniform vec4  u_toneModes;
            uniform vec4  u_toneFrequencies;
            uniform float u_lensStrength;
            uniform float u_edgeSoftness;
            uniform float u_causticIntensity;

            vec3 acesToneMap(vec3 x) {
                const float a = 2.51;
                const float b = 0.03;
                const float c = 2.43;
                const float d = 0.59;
                const float e = 0.14;
                return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
            }

            // Organic liquid underwater caustics (smooth continuous photon network, NO grid lines)
            float getLiquidCaustics(vec2 uv, float t) {
                vec2 p1 = uv * 6.5 + vec2(t * 0.12, t * 0.07);
                vec2 p2 = uv * 11.0 - vec2(t * 0.09, t * 0.14);
                float c1 = sin(p1.x + sin(p1.y * 1.1)) + cos(p1.y + cos(p1.x * 0.9));
                float c2 = sin(p2.x * 1.25 + cos(p2.y * 0.9)) + cos(p2.y * 1.15 - sin(p2.x * 0.95));
                float net = clamp(0.5 + 0.25 * (c1 + c2), 0.0, 1.0);
                return pow(net, 3.2);
            }

            vec2 getSampleUv(vec2 uv) {
                if (uKaleidoscope < 1.5) {
                    return uv;
                }
                vec2 p = uv - uCenter;
                p.x *= uAspect;
                float r = length(p);
                if (r < 0.0001) return uCenter;
                float a = atan(p.y, p.x) + uVortexRotation;
                const float tau = 6.283185307179586;
                float sector = tau / uKaleidoscope;
                float aNorm = mod(a, tau);
                if (aNorm < 0.0) aNorm += tau;
                float sectorIdx = floor(aNorm / sector);
                float subA = aNorm - sectorIdx * sector;
                if (mod(sectorIdx, 2.0) > 0.5) {
                    subA = sector - subA;
                }
                vec2 foldedP = vec2(cos(subA), sin(subA)) * r;
                foldedP.x /= uAspect;
                return clamp(foldedP + uCenter, 0.001, 0.999);
            }

            struct BubbleCavitation {
                float r;
                float theta;
                float radius;
                float sphereZ;
                float flashIntensity;
                float cyclePhase;
                float shockRadius;
                float physicsScale;
            };

            // Rayleigh-Plesset Single-Bubble Acoustic Cavitation Dynamics
            BubbleCavitation getBubbleCavitation(vec2 p) {
                BubbleCavitation b;
                b.r = length(p);
                b.theta = atan(p.y, p.x);

                float drive = clamp(u_audioEnergy, 0.0, 3.0);
                float hz = clamp(u_binauralHz, 0.5, 30.0);
                b.physicsScale = 1.0;

                // Cavitation acoustic cycling frequency (coupled to entrainment / tone frequency)
                float fCav = clamp(hz * 0.45, 0.8, 4.5);
                float cycle = fract(u_time * fCav);
                b.cyclePhase = cycle;

                // Bubble radius limits
                float baseR = 0.125;
                float rMax = baseR * (1.0 + drive * 0.45);
                float rMin = baseR * clamp(u_vanDerWaalsCore, 0.04, 0.25);

                float rad = baseR;
                float flash = 0.0;

                if (drive > 0.005) {
                    if (cycle < 0.72) {
                        // 1. Slow expansion into acoustic rarefaction low-pressure
                        float tExp = cycle / 0.72;
                        rad = mix(baseR, rMax, sin(tExp * 1.5707963));
                        flash = 0.05 * sin(tExp * 3.14159);
                    } else if (cycle < 0.93) {
                        // 2. Catastrophic accelerating supersonic collapse (Rayleigh implosion)
                        float tCol = (cycle - 0.72) / (0.93 - 0.72);
                        float collapseCurve = pow(tCol, 2.8);
                        rad = mix(rMax, rMin, collapseCurve);
                        flash = collapseCurve * 0.25;
                    } else if (cycle < 0.955) {
                        // 3. Turnaround point: peak adiabatic compression & Bremsstrahlung plasma flash!
                        rad = rMin;
                        float tFlash = (cycle - 0.93) / (0.955 - 0.93);
                        float peak = sin(tFlash * 3.14159);
                        flash = 1.0 + peak * 3.5 * (0.8 + 0.6 * drive);
                    } else {
                        // 4. Rebound micro-oscillations & shockwave launch
                        float tReb = (cycle - 0.955) / (1.0 - 0.955);
                        float damp = exp(-tReb * 3.5);
                        rad = rMin + (baseR - rMin) * (1.0 - damp * cos(tReb * 18.0));
                        flash = damp * 0.35;
                    }
                } else {
                    // Serene idle state: tranquil acoustic levitation with gentle breathing star
                    float calmBreath = 0.5 + 0.5 * sin(u_time * 1.8);
                    rad = baseR * (0.95 + 0.06 * calmBreath);
                    flash = 0.40 + 0.20 * calmBreath;
                }

                // Supersonic acoustic shockwave wavefront expanding into the flask liquid
                float shockProgress = cycle >= 0.93 ? (cycle - 0.93) / (1.0 - 0.93) : 0.0;
                b.shockRadius = shockProgress * 0.50;

                // Surface deformation modes (harmonics 2-5 from tone frequencies)
                float deform = 0.0;
                if (u_toneModes.x > 0.001) {
                    deform += sin(b.theta * 2.0 + u_time * u_toneFrequencies.x) * u_toneModes.x;
                    deform += sin(b.theta * 3.0 - u_time * u_toneFrequencies.y) * u_toneModes.y;
                    deform += sin(b.theta * 4.0 + u_time * u_toneFrequencies.z) * u_toneModes.z;
                }
                b.radius = max(0.015, rad * (1.0 + deform * 0.15));
                b.flashIntensity = flash;

                float rho = clamp(b.r / max(0.001, b.radius), 0.0, 1.0);
                b.sphereZ = sqrt(max(0.0, 1.0 - rho * rho));
                return b;
            }

            // Authentic "Star in a Jar": Bremsstrahlung core, celestial corona, starburst diffraction,
            // acoustic shockwaves, and resonator flask chamber illumination
            vec3 calculateSonoluminescenceOverlay(vec2 p, BubbleCavitation b, float audioEnergy, float bubbleMask) {
                if (u_bremsstrahlungGlow <= 0.001) return vec3(0.0);

                // 1. Acoustic Cavitation Resonator Chamber ("The Jar")
                float flaskR = 0.44;
                float flaskDist = abs(b.r - flaskR);
                float flaskGlass = exp(-flaskDist * flaskDist * 2200.0) * 0.22;
                // Acoustic standing wave nodes (nodal pressure rings in resonator)
                float standingWave = (cos(b.r * 50.0) * 0.5 + 0.5) * exp(-b.r * 2.4);
                float nodalRings = standingWave * 0.04 * (0.4 + 0.6 * clamp(audioEnergy, 0.0, 2.0));
                vec3 jarHue = length(u_rimColor) > 0.05 ? u_rimColor : vec3(0.2, 0.6, 1.0);
                vec3 jarChamber = (vec3(0.04, 0.08, 0.16) * flaskGlass + jarHue * nodalRings) * min(2.0, u_bremsstrahlungGlow * 0.8);

                // 2. Supersonic Acoustic Shockwave Ring (expands radially through water following flash)
                vec3 shockwaveLight = vec3(0.0);
                if (b.shockRadius > 0.005) {
                    float shockDist = abs(b.r - b.shockRadius);
                    float shockSharp = exp(-shockDist * shockDist * 3500.0);
                    float shockFade = exp(-b.shockRadius * 3.2);
                    float shockAmp = shockSharp * shockFade * (0.3 + 0.7 * b.flashIntensity);
                    vec3 shockTint = mix(vec3(0.75, 0.95, 1.0), u_glowColor, 0.45);
                    shockwaveLight = shockTint * shockAmp * u_bremsstrahlungGlow * 0.85;
                }

                // 3. Physical Bubble Cavity Meniscus & Total Internal Reflection (TIR)
                float edgeDist = abs(b.r - b.radius);
                float softW = mix(0.003, 0.035, clamp(u_edgeSoftness, 0.0, 1.0));
                float rimAlpha = max(0.0, 1.0 - clamp(u_edgeSoftness, 0.0, 1.0) * 0.85);
                float tirRim = smoothstep(softW, 0.0, edgeDist) * (1.0 - b.sphereZ) * rimAlpha;
                vec3 bubbleMeniscus = mix(vec3(0.35, 0.80, 1.0), u_rimColor, 0.6) * tirRim * 0.55;

                // 4. The Central "Star" (Ultra-Dense Bremsstrahlung Plasma Singularity)
                // White-hot plasma pinpoint core (unclipped optical core)
                float starPinpoint = 1.0 / (1.0 + pow(b.r * 190.0, 2.0));
                vec3 whiteHotCore = vec3(1.0, 1.0, 1.0) * starPinpoint * (3.5 + 8.5 * b.flashIntensity) * u_bremsstrahlungGlow;

                // Celestial Ionization Corona & Plasma Halo
                float corona = 1.0 / (1.0 + pow(b.r * 28.0, 1.55));
                vec3 plasmaHue = mix(vec3(0.60, 0.88, 1.0), u_coreColor, 0.70);
                vec3 celestialCorona = plasmaHue * corona * (1.1 + 2.6 * b.flashIntensity) * u_bremsstrahlungGlow;

                // Volumetric Ambient Illumination through the Liquid
                float liquidVol = (1.0 / (1.0 + b.r * 7.5)) * 0.24 * (0.4 + 0.6 * b.flashIntensity) * u_bremsstrahlungGlow;
                vec3 volGlow = mix(vec3(0.15, 0.55, 0.85), u_coreColor, 0.55) * liquidVol;

                // Optical Starburst / Diffraction Spikes (4-point primary + 45-deg diagonal rays)
                float spikeX = exp(-abs(p.y) * 240.0) * exp(-abs(p.x) * 7.0);
                float spikeY = exp(-abs(p.x) * 240.0) * exp(-abs(p.y) * 7.0);
                vec2 rotP = vec2(p.x - p.y, p.x + p.y) * 0.7071068;
                float spikeD1 = exp(-abs(rotP.y) * 360.0) * exp(-abs(rotP.x) * 12.0);
                float spikeD2 = exp(-abs(rotP.x) * 360.0) * exp(-abs(rotP.y) * 12.0);
                float spikes = (spikeX + spikeY) * 0.60 + (spikeD1 + spikeD2) * 0.20;
                vec3 starSpikes = mix(vec3(1.0), u_coreColor, 0.45) * spikes * (0.7 + 2.2 * b.flashIntensity) * u_bremsstrahlungGlow;

                return jarChamber + shockwaveLight + bubbleMeniscus + whiteHotCore + celestialCorona + volGlow + starSpikes;
            }

            void main () {
                vec2 rawUv = getSampleUv(vUv);
                vec2 p = rawUv - uCenter;
                p.x *= uAspect;

                vec3 c = vec3(0.0);
                BubbleCavitation b;
                float bubbleMask = 0.0;

                // ── Optical Lensing & Bubble Refraction ───────────────────────
                if (u_bremsstrahlungGlow > 0.001) {
                    b = getBubbleCavitation(p);

                    // Soft edge transition width based on user's edgeSoftness
                    float softWidth = mix(0.005, 0.075, clamp(u_edgeSoftness, 0.0, 1.0));
                    bubbleMask = smoothstep(b.radius + softWidth * 0.5, b.radius - softWidth * 0.5, b.r);

                    // Refraction inside spherical bubble (thicker center, Snell's law optical distortion)
                    vec2 rayDir = p / max(0.001, b.r);
                    // Lensing profile: peak spherical curvature displacement, magnifying fluid passing through
                    float lensProfile = b.sphereZ * (1.0 - 0.25 * (1.0 - b.sphereZ));
                    float lensDistort = lensProfile * (0.18 * u_lensStrength);

                    // Acoustic shockwave wavefront refraction (supersonic liquid density gradient)
                    if (b.shockRadius > 0.005) {
                        float shockDist = abs(b.r - b.shockRadius);
                        float shockRipple = sin(shockDist * 160.0) * exp(-shockDist * 70.0) * exp(-b.shockRadius * 2.5);
                        lensDistort += shockRipple * (0.04 * u_lensStrength) * (0.4 + 0.6 * b.flashIntensity);
                    }

                    vec2 refrOffset = rayDir * lensDistort;
                    refrOffset.x /= uAspect;

                    // Chromatic dispersion through spherical bubble medium
                    vec2 uvR = clamp(rawUv - refrOffset * 1.08, 0.001, 0.999);
                    vec2 uvG = clamp(rawUv - refrOffset * 1.00, 0.001, 0.999);
                    vec2 uvB = clamp(rawUv - refrOffset * 0.92, 0.001, 0.999);

                    vec3 refractedFluid = vec3(
                        texture2D(uTexture, uvR).r,
                        texture2D(uTexture, uvG).g,
                        texture2D(uTexture, uvB).b
                    );
                    vec3 rawFluid = texture2D(uTexture, rawUv).rgb;

                    // Smooth blending between raw and refracted fluid (no harsh circular line!)
                    vec3 fluidBase = mix(rawFluid, refractedFluid, bubbleMask);

                    // Liquid Caustics: Organic underwater caustics concentrated strictly inside the bubble lens
                    // (Zero ambient wash on background keeps the simulation dark, serene, and zen)
                    float focusedCaustic = getLiquidCaustics(uvG, u_time) * (0.15 + 0.35 * b.sphereZ) * u_causticIntensity;
                    float causticLight = focusedCaustic * bubbleMask * 0.22;

                    vec3 causticTint = length(u_glowColor) > 0.05 ? u_glowColor : vec3(0.30, 0.70, 0.95);
                    c = fluidBase + causticTint * causticLight;
                } else {
                    c = texture2D(uTexture, rawUv).rgb;
                }

                vec2 uv = rawUv;
                
                // 3D Liquid Surface Normal & Specular Highlights
                if (uShading > 0.5) {
                    vec3 lc = texture2D(uTexture, clamp(uv - vec2(texelSize.x, 0.0), 0.001, 0.999)).rgb;
                    vec3 rc = texture2D(uTexture, clamp(uv + vec2(texelSize.x, 0.0), 0.001, 0.999)).rgb;
                    vec3 tc = texture2D(uTexture, clamp(uv + vec2(0.0, texelSize.y), 0.001, 0.999)).rgb;
                    vec3 bc = texture2D(uTexture, clamp(uv - vec2(0.0, texelSize.y), 0.001, 0.999)).rgb;
                    float dx = length(rc) - length(lc);
                    float dy = length(tc) - length(bc);
                    vec3 n = normalize(vec3(dx * 2.5, dy * 2.5, length(texelSize) * 28.0));
                    vec3 l = normalize(vec3(0.15, 0.25, 0.95));
                    float diffuse = clamp(dot(n, l) * 0.45 + 0.75, 0.65, 1.3);
                    c *= diffuse;

                    // Subtle liquid specular luster
                    vec3 v = vec3(0.0, 0.0, 1.0);
                    vec3 h = normalize(l + v);
                    float spec = pow(max(0.0, dot(n, h)), 24.0) * 0.35 * length(c);
                    c += vec3(spec);
                }

                // Bloom integration with soft exponential blending
                if (uBloomEnabled > 0.5) {
                    vec3 bloom = texture2D(uBloom, uv).rgb;
                    if (uSunraysEnabled > 0.5) {
                        float sunrays = texture2D(uSunrays, uv).r;
                        c *= sunrays;
                        bloom *= sunrays;
                    }
                    c += bloom * 0.35;
                } else if (uSunraysEnabled > 0.5) {
                    float sunrays = texture2D(uSunrays, uv).r;
                    c *= sunrays;
                }

                // Saturation adjustment
                if (uSaturation > 0.01 && abs(uSaturation - 1.0) > 0.01) {
                    float luminance = dot(c, vec3(0.2126, 0.7152, 0.0722));
                    c = mix(vec3(luminance), c, uSaturation);
                }

                // Single-Bubble Sonoluminescence (SBSL) Core Bremsstrahlung Flash, Specular Highlights & Acoustic Shockwaves
                if (u_bremsstrahlungGlow > 0.001) {
                    c += calculateSonoluminescenceOverlay(p, b, u_audioEnergy, bubbleMask);
                }

                // ACES Filmic Tone Mapping: preserves deep vibrant chromatic saturation even at high intensities
                vec3 mappedColor = acesToneMap(c);
                float op = clamp(uMasterOpacity, 0.0, 1.0);

                if (uTransparent > 0.5) {
                    float a = max(mappedColor.r, max(mappedColor.g, mappedColor.b)) * op;
                    gl_FragColor = vec4(mappedColor, a);
                } else {
                    float a = clamp(max(mappedColor.r, max(mappedColor.g, mappedColor.b)) * 1.5, 0.0, 1.0);
                    vec3 finalColor = mix(uBackColor, mappedColor, a);
                    gl_FragColor = vec4(finalColor, op);
                }
            }`);

        this.fbos.FBO = FBO;
        this.fbos.DoubleFBO = DoubleFBO;
        this.initialized = true;
    }

    public destroy() {
        const gl = this.gl;
        if (!gl) return;

        // Reset FBO instances only, do not delete compiled shader programs or FBO classes
        const deleteFbo = (fbo: any) => {
            if (!fbo) return;
            if (fbo.texture) gl.deleteTexture(fbo.texture);
            if (fbo.fbo) gl.deleteFramebuffer(fbo.fbo);
            if (fbo.read) {
                if (fbo.read.texture) gl.deleteTexture(fbo.read.texture);
                if (fbo.read.fbo) gl.deleteFramebuffer(fbo.read.fbo);
            }
            if (fbo.write) {
                if (fbo.write.texture) gl.deleteTexture(fbo.write.texture);
                if (fbo.write.fbo) gl.deleteFramebuffer(fbo.write.fbo);
            }
        };

        // Delete active FBO instances
        for (const key of ['velocity', 'density', 'divergence', 'curl', 'pressure']) {
            if (this.fbos[key]) {
                deleteFbo(this.fbos[key]);
                delete this.fbos[key];
            }
        }
        for (const fbo of this.bloomFbos) {
            deleteFbo(fbo);
        }
        this.bloomFbos = [];
        if (this.bloom) {
            deleteFbo(this.bloom);
            this.bloom = null;
        }
        if (this.sunraysFbo) {
            deleteFbo(this.sunraysFbo);
            this.sunraysFbo = null;
        }
        if (this.sunraysTempFbo) {
            deleteFbo(this.sunraysTempFbo);
            this.sunraysTempFbo = null;
        }

        this.initialized = false;
    }

    public getResolution(resolution: number, canvasW: number, canvasH: number) {
        let aspectRatio = canvasW / canvasH;
        if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
        const min = Math.round(resolution);
        const max = Math.round(resolution * aspectRatio);
        if (canvasW > canvasH) return { width: max, height: min };
        else return { width: min, height: max };
    }

    public initFramebuffers(config: any, canvasW: number, canvasH: number) {
        if (!this.initialized) return;
        const gl = this.gl as any;

        const simRes = this.getResolution(config.simRes, canvasW, canvasH);
        const dyeRes = this.getResolution(config.dyeRes, canvasW, canvasH);

        const texType  = this.ext.halfFloatTexType;
        const rgba     = this.ext.formatRGBA;
        const rg       = this.ext.formatRG;
        const r        = this.ext.formatR;
        const filtering = this.ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

        gl.disable(gl.BLEND);

        if (!this.fbos.velocity
            || this.fbos.velocity.width  !== simRes.width
            || this.fbos.velocity.height !== simRes.height
            || !this.fbos.density
            || this.fbos.density.width !== dyeRes.width
            || this.fbos.density.height !== dyeRes.height) {
            
            // Clean up old FBOs before creating new ones to prevent memory leaks
            if (this.fbos.density) {
                if (this.fbos.density.read) gl.deleteTexture(this.fbos.density.read.texture);
                if (this.fbos.density.write) gl.deleteTexture(this.fbos.density.write.texture);
            }
            if (this.fbos.velocity) {
                if (this.fbos.velocity.read) gl.deleteTexture(this.fbos.velocity.read.texture);
                if (this.fbos.velocity.write) gl.deleteTexture(this.fbos.velocity.write.texture);
            }
            if (this.fbos.divergence) gl.deleteTexture(this.fbos.divergence.texture);
            if (this.fbos.curl) gl.deleteTexture(this.fbos.curl.texture);
            if (this.fbos.pressure) {
                if (this.fbos.pressure.read) gl.deleteTexture(this.fbos.pressure.read.texture);
                if (this.fbos.pressure.write) gl.deleteTexture(this.fbos.pressure.write.texture);
            }

            this.fbos.density  = new this.fbos.DoubleFBO(dyeRes.width,  dyeRes.height,  rgba.internalFormat, rgba.format, texType, filtering);
            this.fbos.velocity = new this.fbos.DoubleFBO(simRes.width,  simRes.height,  rg.internalFormat,   rg.format,   texType, filtering);
            this.fbos.divergence = new this.fbos.FBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
            this.fbos.curl       = new this.fbos.FBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
            this.fbos.pressure   = new this.fbos.DoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        }

        // bloom: one top-level FBO + mip chain (Pavel's initBloomFramebuffers)
        {
            const res = this.getResolution(config.bloomResolution, canvasW, canvasH);
            if (!this.bloom || this.bloom.width !== res.width) {
                this.bloom = new this.fbos.FBO(res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering);
                this.bloomFbos = [];
                let w = res.width  >> 1;
                let h = res.height >> 1;
                for (let i = 0; i < config.bloomIterations; i++) {
                    if (w < 2 || h < 2) break;
                    this.bloomFbos.push(new this.fbos.FBO(w, h, rgba.internalFormat, rgba.format, texType, filtering));
                    w >>= 1;
                    h >>= 1;
                }
            }
        }

        // sunrays
        if (!this.sunraysFbo || this.sunraysFbo.width !== config.sunraysResolution) {
            const res = config.sunraysResolution;
            this.sunraysFbo     = new this.fbos.FBO(res, res, r.internalFormat, r.format, texType, filtering);
            this.sunraysTempFbo = new this.fbos.FBO(res, res, r.internalFormat, r.format, texType, filtering);
        }
    }

    // correctRadius matches Pavel's: multiplies by aspectRatio when landscape
    private correctRadius(radius: number, canvasW?: number, canvasH?: number): number {
        const aspectRatio = (canvasW && canvasH && canvasH > 0) ? (canvasW / canvasH) : 1.0;
        if (aspectRatio > 1) radius *= aspectRatio;
        return radius;
    }

    public splat(x: number, y: number, dx: number, dy: number, color: {r:number,g:number,b:number}, radius: number, canvasW?: number, canvasH?: number) {
        if (!this.initialized) return;
        if (!this.fbos.velocity || !this.fbos.density) {
            this.initFramebuffers({
                simRes: 128,
                dyeRes: 512,
                bloomResolution: 256,
                bloomIterations: 6,
                sunraysResolution: 196
            }, canvasW || 512, canvasH || 512);
        }
        if (!this.fbos.velocity || !this.fbos.density) return;
        const gl = this.gl as any;
        const aspect = (canvasW && canvasH) ? (canvasW / canvasH) : 1.0;

        this.programs.splat.bind();
        gl.uniform1i(this.programs.splat.uniforms.uTarget, this.fbos.velocity.read.attach(0));
        gl.uniform1f(this.programs.splat.uniforms.aspectRatio, aspect);
        gl.uniform2f(this.programs.splat.uniforms.point, x, y);
        gl.uniform3f(this.programs.splat.uniforms.color, dx, dy, 0.0);
        gl.uniform1f(this.programs.splat.uniforms.radius, this.correctRadius(radius / 100.0, canvasW, canvasH));
        this.blit(this.fbos.velocity.write);
        this.fbos.velocity.swap();

        gl.uniform1i(this.programs.splat.uniforms.uTarget, this.fbos.density.read.attach(0));
        gl.uniform3f(this.programs.splat.uniforms.color, color.r, color.g, color.b);
        this.blit(this.fbos.density.write);
        this.fbos.density.swap();
    }

    public multipleSplats(amount: number, canvasW: number, canvasH: number) {
        for (let i = 0; i < amount; i++) {
            const color = {
                r: Math.random() * 0.15 * 10.0,
                g: Math.random() * 0.15 * 10.0,
                b: Math.random() * 0.15 * 10.0
            };
            const x  = Math.random();
            const y  = Math.random();
            const dx = 1000 * (Math.random() - 0.5);
            const dy = 1000 * (Math.random() - 0.5);
            this.splat(x, y, dx, dy, color, 0.25, canvasW, canvasH);
        }
    }

    // blur: Pavel's separable Gaussian (horizontal then vertical pass)
    private blur(target: any, temp: any, iterations: number) {
        const gl = this.gl as any;
        this.programs.blur.bind();
        for (let i = 0; i < iterations; i++) {
            gl.uniform2f(this.programs.blur.uniforms.texelSize, target.texelSizeX, 0.0);
            gl.uniform1i(this.programs.blur.uniforms.uTexture, target.attach(0));
            this.blit(temp);
            gl.uniform2f(this.programs.blur.uniforms.texelSize, 0.0, target.texelSizeY);
            gl.uniform1i(this.programs.blur.uniforms.uTexture, temp.attach(0));
            this.blit(target);
        }
    }

    // applyBloom: matches Pavel's structure exactly
    private applyBloom(source: any, destination: any, config: any) {
        const gl = this.gl as any;
        if (this.bloomFbos.length < 2) return;

        let last = destination;
        gl.disable(gl.BLEND);

        this.programs.bloomPrefilter.bind();
        const knee   = config.bloomThreshold * config.bloomSoftKnee + 0.0001;
        const curve0 = config.bloomThreshold - knee;
        const curve1 = knee * 2;
        const curve2 = 0.25 / knee;
        gl.uniform3f(this.programs.bloomPrefilter.uniforms.curve, curve0, curve1, curve2);
        gl.uniform1f(this.programs.bloomPrefilter.uniforms.threshold, config.bloomThreshold);
        gl.uniform1i(this.programs.bloomPrefilter.uniforms.uTexture, source.attach(0));
        this.blit(last);

        // Downsample into mip chain
        this.programs.bloomBlur.bind();
        for (let i = 0; i < this.bloomFbos.length; i++) {
            const dest = this.bloomFbos[i];
            gl.uniform2f(this.programs.bloomBlur.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            gl.uniform1i(this.programs.bloomBlur.uniforms.uTexture, last.attach(0));
            this.blit(dest);
            last = dest;
        }

        // Upsample with additive blend
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.enable(gl.BLEND);
        for (let i = this.bloomFbos.length - 2; i >= 0; i--) {
            const baseTex = this.bloomFbos[i];
            gl.uniform2f(this.programs.bloomBlur.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
            gl.uniform1i(this.programs.bloomBlur.uniforms.uTexture, last.attach(0));
            gl.viewport(0, 0, baseTex.width, baseTex.height);
            this.blit(baseTex);
            last = baseTex;
        }
        gl.disable(gl.BLEND);

        // Final intensity pass into destination
        this.programs.bloomFinal.bind();
        gl.uniform2f(this.programs.bloomFinal.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        gl.uniform1i(this.programs.bloomFinal.uniforms.uTexture, last.attach(0));
        const effectiveBloomIntensity = config.glowIntensity !== undefined ? config.glowIntensity : (config.bloomIntensity !== undefined ? config.bloomIntensity : 0.45);
        gl.uniform1f(this.programs.bloomFinal.uniforms.intensity, effectiveBloomIntensity);
        this.blit(destination);
    }

    public step(dt: number, config: any, canvasW: number, canvasH: number) {
        if (!this.initialized || config.paused || canvasW <= 0 || canvasH <= 0) return;
        const gl = this.gl as any;

        const clampedDt = Math.min(dt, 0.016666);
        this.initFramebuffers(config, canvasW, canvasH);
        gl.disable(gl.BLEND);

        // Curl + vorticity confinement
        this.programs.curl.bind();
        gl.uniform2f(this.programs.curl.uniforms.texelSize, this.fbos.velocity.texelSizeX, this.fbos.velocity.texelSizeY);
        gl.uniform1i(this.programs.curl.uniforms.uVelocity, this.fbos.velocity.read.attach(0));
        this.blit(this.fbos.curl);

        this.programs.vorticity.bind();
        gl.uniform2f(this.programs.vorticity.uniforms.texelSize, this.fbos.velocity.texelSizeX, this.fbos.velocity.texelSizeY);
        gl.uniform1i(this.programs.vorticity.uniforms.uVelocity, this.fbos.velocity.read.attach(0));
        gl.uniform1i(this.programs.vorticity.uniforms.uCurl, this.fbos.curl.attach(1));
        gl.uniform1f(this.programs.vorticity.uniforms.curl, config.curl);
        gl.uniform1f(this.programs.vorticity.uniforms.dt, clampedDt);
        this.blit(this.fbos.velocity.write);
        this.fbos.velocity.swap();

        // Divergence
        this.programs.divergence.bind();
        gl.uniform2f(this.programs.divergence.uniforms.texelSize, this.fbos.velocity.texelSizeX, this.fbos.velocity.texelSizeY);
        gl.uniform1i(this.programs.divergence.uniforms.uVelocity, this.fbos.velocity.read.attach(0));
        this.blit(this.fbos.divergence);

        // Pressure solve: use clearProgram to decay existing pressure by config.pressure (0–1)
        this.programs.clear.bind();
        gl.uniform1i(this.programs.clear.uniforms.uTexture, this.fbos.pressure.read.attach(0));
        gl.uniform1f(this.programs.clear.uniforms.value, config.pressure);
        this.blit(this.fbos.pressure.write);
        this.fbos.pressure.swap();

        this.programs.pressure.bind();
        gl.uniform2f(this.programs.pressure.uniforms.texelSize, this.fbos.velocity.texelSizeX, this.fbos.velocity.texelSizeY);
        gl.uniform1i(this.programs.pressure.uniforms.uDivergence, this.fbos.divergence.attach(0));
        for (let i = 0; i < config.pressureIterations; i++) {
            gl.uniform1i(this.programs.pressure.uniforms.uPressure, this.fbos.pressure.read.attach(1));
            this.blit(this.fbos.pressure.write);
            this.fbos.pressure.swap();
        }

        // Gradient subtract
        this.programs.gradientSubtract.bind();
        gl.uniform2f(this.programs.gradientSubtract.uniforms.texelSize, this.fbos.velocity.texelSizeX, this.fbos.velocity.texelSizeY);
        gl.uniform1i(this.programs.gradientSubtract.uniforms.uPressure, this.fbos.pressure.read.attach(0));
        gl.uniform1i(this.programs.gradientSubtract.uniforms.uVelocity, this.fbos.velocity.read.attach(1));
        this.blit(this.fbos.velocity.write);
        this.fbos.velocity.swap();

        // Advection — velocity self-advects
        this.programs.advection.bind();
        gl.uniform2f(this.programs.advection.uniforms.texelSize, this.fbos.velocity.texelSizeX, this.fbos.velocity.texelSizeY);
        gl.uniform2f(this.programs.advection.uniforms.dyeTexelSize, this.fbos.velocity.texelSizeX, this.fbos.velocity.texelSizeY);
        const velocityId = this.fbos.velocity.read.attach(0);
        gl.uniform1i(this.programs.advection.uniforms.uVelocity, velocityId);
        gl.uniform1i(this.programs.advection.uniforms.uSource,   velocityId);
        gl.uniform1f(this.programs.advection.uniforms.dt, clampedDt);
        gl.uniform1f(this.programs.advection.uniforms.dissipation, config.velocityDissipation);
        this.blit(this.fbos.velocity.write);
        this.fbos.velocity.swap();

        // Advection — dye
        gl.uniform2f(this.programs.advection.uniforms.dyeTexelSize, this.fbos.density.texelSizeX, this.fbos.density.texelSizeY);
        gl.uniform1i(this.programs.advection.uniforms.uVelocity, this.fbos.velocity.read.attach(0));
        gl.uniform1i(this.programs.advection.uniforms.uSource,   this.fbos.density.read.attach(1));
        const effectiveDissipation = config.tailTrail !== undefined ? config.tailTrail : (config.densityDissipation !== undefined ? config.densityDissipation : 0.985);
        gl.uniform1f(this.programs.advection.uniforms.dissipation, effectiveDissipation);
        this.blit(this.fbos.density.write);
        this.fbos.density.swap();

        // ── RENDER ──
        if (config.bloom && this.bloom) {
            this.applyBloom(this.fbos.density.read, this.bloom, config);
        }

        if (config.sunrays && this.sunraysFbo) {
            // mask pass
            this.programs.sunraysMask.bind();
            gl.uniform1i(this.programs.sunraysMask.uniforms.uTexture, this.fbos.density.read.attach(0));
            this.blit(this.sunraysFbo);
            // rays pass
            this.programs.sunrays.bind();
            gl.uniform1f(this.programs.sunrays.uniforms.weight, config.sunraysWeight);
            gl.uniform1i(this.programs.sunrays.uniforms.uTexture, this.sunraysFbo.attach(0));
            this.blit(this.sunraysTempFbo);
            // blur the sunrays (Pavel always does 1 iteration)
            this.blur(this.sunraysTempFbo, this.sunraysFbo, 1);
        }

        gl.disable(gl.BLEND);

        this.programs.display.bind();
        gl.uniform2f(this.programs.display.uniforms.texelSize, this.fbos.density.texelSizeX, this.fbos.density.texelSizeY);
        gl.uniform1i(this.programs.display.uniforms.uTexture,  this.fbos.density.read.attach(0));
        gl.uniform1i(this.programs.display.uniforms.uBloom,
            config.bloom && this.bloom ? this.bloom.attach(1) : this.fbos.density.read.attach(1));
        gl.uniform1i(this.programs.display.uniforms.uSunrays,
            config.sunrays && this.sunraysTempFbo ? this.sunraysTempFbo.attach(2) : this.fbos.density.read.attach(2));
        gl.uniform3f(this.programs.display.uniforms.uBackColor,     config.backColor.r, config.backColor.g, config.backColor.b);
        gl.uniform1f(this.programs.display.uniforms.uShading,       config.shading ? 1.0 : 0.0);
        gl.uniform1f(this.programs.display.uniforms.uBloomEnabled,  config.bloom   ? 1.0 : 0.0);
        gl.uniform1f(this.programs.display.uniforms.uSunraysEnabled,config.sunrays ? 1.0 : 0.0);
        gl.uniform1f(this.programs.display.uniforms.uTransparent,   config.transparent ? 1.0 : 0.0);

        // Kaleidoscope, color grade, and centering uniforms
        gl.uniform1f(this.programs.display.uniforms.uKaleidoscope,  config.kaleidoscope || 0.0);
        gl.uniform2f(this.programs.display.uniforms.uCenter,        config.centerX !== undefined ? config.centerX : 0.5, config.centerY !== undefined ? config.centerY : 0.5);
        gl.uniform1f(this.programs.display.uniforms.uAspect,        canvasW > 0 && canvasH > 0 ? canvasW / canvasH : 1.0);
        gl.uniform1f(this.programs.display.uniforms.uVortexRotation,config.vortexRotation || 0.0);
        gl.uniform1f(this.programs.display.uniforms.uSaturation,    config.saturation !== undefined ? config.saturation : 1.0);
        gl.uniform1f(this.programs.display.uniforms.uMasterOpacity, config.masterOpacity !== undefined ? config.masterOpacity : 1.0);

        // Sonoluminescence (Acoustic Cavitation & Bremsstrahlung) uniforms
        if (this.programs.display.uniforms.u_binauralHz !== undefined) {
            gl.uniform1f(this.programs.display.uniforms.u_binauralHz, config.binauralHz !== undefined ? config.binauralHz : 7.83);
            gl.uniform1f(this.programs.display.uniforms.u_vanDerWaalsCore, config.vanDerWaalsCore !== undefined ? config.vanDerWaalsCore : 0.12);
            gl.uniform1f(this.programs.display.uniforms.u_bremsstrahlungGlow, config.bremsstrahlungGlow !== undefined ? config.bremsstrahlungGlow : 0.0);
            gl.uniform1f(this.programs.display.uniforms.u_audioEnergy, config.audioEnergy !== undefined ? config.audioEnergy : 0.0);
            gl.uniform1f(this.programs.display.uniforms.u_time, config.time !== undefined ? config.time : 0.0);

            // Harmonic colors linked with tones & selected color wheel
            const cColor = config.coreColor || { r: 0.25, g: 0.75, b: 1.0 };
            const rColor = config.rimColor  || { r: 0.20, g: 0.65, b: 0.95 };
            const gColor = config.glowColor || { r: 0.30, g: 0.70, b: 1.0 };
            if (this.programs.display.uniforms.u_coreColor !== undefined) {
                gl.uniform3f(this.programs.display.uniforms.u_coreColor, cColor.r, cColor.g, cColor.b);
            }
            if (this.programs.display.uniforms.u_rimColor !== undefined) {
                gl.uniform3f(this.programs.display.uniforms.u_rimColor,  rColor.r,  rColor.g,  rColor.b);
            }
            if (this.programs.display.uniforms.u_glowColor !== undefined) {
                gl.uniform3f(this.programs.display.uniforms.u_glowColor, gColor.r, gColor.g, gColor.b);
            }

            // Modal surface harmonic deformations, tone frequencies, and optical lensing strength
            const tm = config.toneModes || [0.0, 0.0, 0.0, 0.0];
            if (this.programs.display.uniforms.u_toneModes !== undefined) {
                gl.uniform4f(this.programs.display.uniforms.u_toneModes, tm[0] || 0.0, tm[1] || 0.0, tm[2] || 0.0, tm[3] || 0.0);
            }
            const tf = config.toneFrequencies || [1.0, 1.5, 2.0, 2.5];
            if (this.programs.display.uniforms.u_toneFrequencies !== undefined) {
                gl.uniform4f(this.programs.display.uniforms.u_toneFrequencies, tf[0] || 1.0, tf[1] || 1.5, tf[2] || 2.0, tf[3] || 2.5);
            }
            if (this.programs.display.uniforms.u_lensStrength !== undefined) {
                gl.uniform1f(this.programs.display.uniforms.u_lensStrength, config.lensStrength !== undefined ? config.lensStrength : 0.35);
            }
            if (this.programs.display.uniforms.u_edgeSoftness !== undefined) {
                gl.uniform1f(this.programs.display.uniforms.u_edgeSoftness, config.edgeSoftness !== undefined ? config.edgeSoftness : 0.85);
            }
            if (this.programs.display.uniforms.u_causticIntensity !== undefined) {
                gl.uniform1f(this.programs.display.uniforms.u_causticIntensity, config.causticIntensity !== undefined ? config.causticIntensity : 1.0);
            }
        }

        this.blit(null);
        gl.disable(gl.BLEND);
    }
}