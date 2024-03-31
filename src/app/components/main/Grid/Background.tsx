import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useAtom } from 'jotai';
import { BACKGROUND, GRID_POSITION } from '@/app/data/globals';
import useResize from '@/app/hooks/useResize';
import { parseRGB } from '../../../data/management';

const BACKGROUND_SHADER = `
    uniform vec2 offset;
    uniform vec2 size;
    uniform vec3 background;

    vec3 rgb(in int r, in int g, in int b){
        return vec3(float(r), float(g),float(b)) / 255.;
    }

    float random (in vec2 st) {
        return fract(sin(dot(st.xy,
                            vec2(12.9898,78.233)))
                    * 43758.5453123);
    }

    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f*f*(3.0-2.0*f);
        // u = smoothstep(0.,1.,f);

        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    void main() {
        vec2 st = (gl_FragCoord.xy + offset * vec2(-1., 1.)) / size;
        //vec3 color1 = rgb(43, 107, 217);
        //vec3 color2 = rgb(0, 42, 144);
        vec3 color1 = background / 255.;
        vec3 color2 = background / 255. * 0.7;
        float t = noise(st * 1.2);
        vec3 col = color1 + (color2 - color1) * t;
        col *= col;

        gl_FragColor = vec4(col, 1.);
    }
`;

const Background = () => {
    const size = useResize();
    const bgr = useAtom(BACKGROUND)[0];
    const parsed = parseRGB(bgr);
    const uniformsRef = useRef({
        offset: new THREE.Uniform(new THREE.Vector2(0, 0)),
        size: new THREE.Uniform(new THREE.Vector2(size.x, size.y)),
        background: new THREE.Uniform(new THREE.Vector3(parsed.r, parsed.g, parsed.b))
    });
    console.log(bgr);
    const [globalPosition] = useAtom(GRID_POSITION);
    useEffect(() => {
        uniformsRef.current.offset.value.set(globalPosition.x, globalPosition.y);
        console.log(bgr);
        const parsed = parseRGB(bgr);
        uniformsRef.current.background.value.set(parsed.r, parsed.g, parsed.b);
        //uniformsRef.current.size.value.set(size.x, size.y);
    }, [globalPosition, size, bgr]);

    return (
        <Canvas style={{ position: 'fixed', width: '100%', height: '100%' }}>
            <mesh>
                <planeGeometry args={[size.x, size.y]} />
                <shaderMaterial uniforms={uniformsRef.current} fragmentShader={BACKGROUND_SHADER} />
            </mesh>
        </Canvas>
    );
};

export default Background;
