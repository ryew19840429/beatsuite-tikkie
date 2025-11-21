import React, { useState, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';

export function Draggable({ children, initialPosition = [0, 0, 0] }) {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const { camera, raycaster, scene } = useThree();
    const planeIntersectPoint = useRef(new THREE.Vector3());
    const dragOffset = useRef(new THREE.Vector3());

    const onPointerDown = (e) => {
        e.stopPropagation();
        // Calculate the offset between the click point and the object's position
        // We need to raycast against a virtual plane at the object's height
        const normal = new THREE.Vector3(0, 1, 0);
        const planeConstant = -initialPosition[1]; // Plane at y = object height
        const plane = new THREE.Plane(normal, planeConstant);

        raycaster.setFromCamera(e.pointer, camera);
        raycaster.ray.intersectPlane(plane, planeIntersectPoint.current);

        dragOffset.current.subVectors(new THREE.Vector3(...position), planeIntersectPoint.current);

        setIsDragging(true);
        e.target.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        e.stopPropagation();

        const normal = new THREE.Vector3(0, 1, 0);
        const planeConstant = -initialPosition[1];
        const plane = new THREE.Plane(normal, planeConstant);

        raycaster.setFromCamera(e.pointer, camera);
        raycaster.ray.intersectPlane(plane, planeIntersectPoint.current);

        const newPos = new THREE.Vector3()
            .addVectors(planeIntersectPoint.current, dragOffset.current);

        // Constrain Y to initial height
        setPosition([newPos.x, initialPosition[1], newPos.z]);
    };

    const onPointerUp = (e) => {
        setIsDragging(false);
        e.target.releasePointerCapture(e.pointerId);
    };

    return (
        <group
            position={position}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
        >
            {children}
        </group>
    );
}
