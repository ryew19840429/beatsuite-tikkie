import React, { useState, useRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';

export function Draggable({ children, initialPosition = [0, 0, 0], setIsDragging }) {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDraggingLocal] = useState(false);
    const { camera, raycaster, scene } = useThree();
    const planeIntersectPoint = useRef(new THREE.Vector3());
    const dragOffset = useRef(new THREE.Vector3());

    // Memoize plane to avoid recreation on every event
    const plane = useMemo(() => {
        const normal = new THREE.Vector3(0, 1, 0);
        const planeConstant = -initialPosition[1];
        return new THREE.Plane(normal, planeConstant);
    }, [initialPosition]);

    const onPointerDown = (e) => {
        e.stopPropagation();
        // Use memoized plane for raycasting
        raycaster.setFromCamera(e.pointer, camera);
        raycaster.ray.intersectPlane(plane, planeIntersectPoint.current);

        dragOffset.current.subVectors(new THREE.Vector3(...position), planeIntersectPoint.current);

        setIsDraggingLocal(true);
        if (setIsDragging) setIsDragging(true);
        e.target.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        e.stopPropagation();

        // Use memoized plane for raycasting
        raycaster.setFromCamera(e.pointer, camera);
        raycaster.ray.intersectPlane(plane, planeIntersectPoint.current);

        const newPos = new THREE.Vector3()
            .addVectors(planeIntersectPoint.current, dragOffset.current);

        // Constrain Y to initial height
        setPosition([newPos.x, initialPosition[1], newPos.z]);
    };

    const onPointerUp = (e) => {
        setIsDraggingLocal(false);
        if (setIsDragging) setIsDragging(false);
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
