AFRAME.registerSystem("glow", {
    init: function () {
      var renderTarget = this.renderTarget = new THREE.WebGLRenderTarget(1, 1, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat});
      
      this.renderTarget.texture.generateMipmaps = false;
      this.renderTarget.depthBuffer = true;
      this.renderTarget.depthTexture = new THREE.DepthTexture();
      this.renderTarget.depthTexture.type = THREE.UnsignedShortType;
      this.renderTarget.depthTexture.minFilter = THREE.LinearFilter;
      this.renderTarget.stencilBuffer = false;

      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.quadMaterial = new THREE.MeshBasicMaterial({map: renderTarget.texture});
      this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.quadMaterial);
      this.quad.frustumCulled = false;

      this.scene.add(this.quad);
      this.sceneLeft = new THREE.Scene();
      this.quadLeft = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
      this.quadLeft.geometry.attributes.uv.array.set([0, 1, 0.5, 1, 0, 0, 0.5, 0]);
      this.quadLeft.frustumCulled = false;
      this.sceneLeft.add(this.quadLeft);
      this.sceneRight = new THREE.Scene();
      this.quadRight = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
      this.quadRight.geometry.attributes.uv.array.set([0.5, 1, 1, 1, 0.5, 0, 1, 0]);
      this.quadRight.frustumCulled = false;
      this.sceneRight.add(this.quadRight);
      this.targets = [
        new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat }),
        new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat })
      ];

      this.tDiffuse = {type: "t", value: null};
      this.tDepth = {type: "t", value: this.renderTarget.depthTexture};
      this.cameraFar = {type: "f", value: 0};
      this.cameraNear = {type: "f", value: 0};
      this.time = { type: "f", value: 0 };
      this.timeDelta = { type: "f", value: 0 };
      this.uvClamp = { type: "v2", value: this.uvBoth };
      this.resolution = { type: "v4", value: new THREE.Vector4() }; 

      this.sceneEl.renderTarget = renderTarget;
      this.initBloom();

      window.addEventListener('vrdisplaypresentchange', this.onVRPresentChange.bind(this));
    },

    initBloom: function () {
      var convolutionShader = THREE.ConvolutionShader;
      var kernelSize = 25; 
      var sigma = 2.0;
      var strength = 1;
      var parameters = {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat};

      this.imageIncrementX = new THREE.Vector2(0.001953125, 0.0);
      this.renderTargetX = new THREE.WebGLRenderTarget(1, 1, parameters);
      this.renderTargetX.texture.name = "BloomPass.x";

      this.imageIncrementY = new THREE.Vector2( 0.0, 0.001953125 );
      this.renderTargetY = new THREE.WebGLRenderTarget(1, 1, parameters);
      this.renderTargetY.texture.name = "BloomPass.y";

      this.convolutionUniforms = THREE.UniformsUtils.clone( convolutionShader.uniforms );

      this.convolutionUniforms["cKernel"].value = THREE.ConvolutionShader.buildKernel( sigma );

      this.materialConvolution = new THREE.ShaderMaterial( {
        uniforms: this.convolutionUniforms,
        vertexShader:  convolutionShader.vertexShader,
        fragmentShader: convolutionShader.fragmentShader,
        defines: {
          "KERNEL_SIZE_FLOAT": kernelSize.toFixed( 1 ),
          "KERNEL_SIZE_INT": kernelSize.toFixed( 0 )
        }
      });

      var copyShader = THREE.CopyShader;
      this.copyUniforms = THREE.UniformsUtils.clone( copyShader.uniforms );
      this.copyUniforms["opacity"].value = strength;

      this.materialCopy = new THREE.ShaderMaterial( {
        uniforms: this.copyUniforms,
        vertexShader: copyShader.vertexShader,
        fragmentShader: copyShader.fragmentShader,
        blending: THREE.NoBlending,
        transparent: true
      });

      var luminosityShader = THREE.LuminosityHighPassShader;
      this.luminosityUniforms = THREE.UniformsUtils.clone(luminosityShader.uniforms);
      this.luminosityUniforms ["luminosityThreshold"].value = 0.0;
      this.luminosityUniforms["smoothWidth"].value = 10;

      this.materialLuminosity = new THREE.ShaderMaterial({
        uniforms: this.luminosityUniforms,
        vertexShader: luminosityShader.vertexShader,
        fragmentShader: luminosityShader.fragmentShader,
        defines: {}
      });

      this.resizeRenderTarget();
    },

    uvLeft: new THREE.Vector2(0, 0.5),
    uvRight: new THREE.Vector2(0.5, 1),
    uvBoth: new THREE.Vector2(0, 1),

    resizeRenderTarget: function () {
      var renderer = this.el.renderer;
      var renderTarget = this.renderTarget;
      var renderTargetX = this.renderTargetX;
      var renderTargetY = this.renderTargetY;
      var rendererSize = renderer.getSize();
      var eyeParameters;
      var width;
      var height;

      if (renderer.vr.enabled) {
        debugger; 
        eyeParameters = renderer.vr.getDevice().getEyeParameters( 'left' );
        width = eyeParameters.renderWidth * 2;
        height = eyeParameters.renderHeight;
      } else {
        width = rendererSize.width;
        height = rendererSize.height;
      }

      renderTarget.setSize(width, height);
      renderTarget.viewport.set(0, 0, width, height);
      renderTarget.scissor.set(0, 0, width, height);

      renderTargetX.setSize(width, height);
      renderTargetX.viewport.set(0, 0, width, height);
      renderTargetX.scissor.set(0, 0, width, height);

      renderTargetY.setSize(width, height);
      renderTargetY.viewport.set(0, 0, width, height);
      renderTargetY.scissor.set(0, 0, width, height);
    },

    onVRPresentChange: function (evt) {
      this.resizeRenderTarget();
    },

    tock: function () {
      var sceneEl = this.sceneEl; 
      var renderer = sceneEl.renderer;
      var vrEnabled;
      if (this.runningTock) {
        this.runningTock = false;
        return;
      }
      this.runningTock = true;
      vrEnabled = renderer.vr.enabled;

      renderer.vr.enabled = false;
      
      this.quad.material = this.materialConvolution;
      this.convolutionUniforms["tDiffuse"].value = this.renderTarget.texture;
      this.convolutionUniforms["uImageIncrement"].value = this.imageIncrementX;
      renderer.render(this.scene, this.camera, this.renderTargetX);

      this.convolutionUniforms["tDiffuse"].value = this.renderTargetX.texture;
      this.convolutionUniforms["uImageIncrement"].value = this.imageIncrementY;
      // renderer.render(this.scene, this.camera, this.renderTargetY);

      // this.quad.material = this.materialLuminosity;
      // this.luminosityUniforms["tDiffuse"].value = this.renderTargetY.texture;
      // this.luminosityUniforms["luminosityThreshold"].value = 0.8;

      // this.quad.material = this.materialCopy;
      // this.copyUniforms["tDiffuse"].value = this.renderTarget.texture;
      renderer.render(this.scene, this.camera, undefined, true);

      renderer.vr.enabled = vrEnabled;
    }
});
