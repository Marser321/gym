"use client";

import { useState, useEffect, useRef } from "react";

export function useWorkoutTimer() {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Rest Timer
    const [restSeconds, setRestSeconds] = useState(0);
    const [isResting, setIsResting] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        if (!isPaused) {
            intervalRef.current = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);

                if (isResting && restSeconds > 0) {
                    setRestSeconds((prev) => {
                        if (prev <= 1) {
                            setIsResting(false);
                            // Play sound or vibration here
                            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPaused, isResting, restSeconds]);

    const startRest = (seconds: number) => {
        setRestSeconds(seconds);
        setIsResting(true);
    };

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        elapsedSeconds,
        formattedTime: formatTime(elapsedSeconds),
        restSeconds,
        formattedRestTime: formatTime(restSeconds),
        isResting,
        startRest,
        togglePause: () => setIsPaused(!isPaused),
        isPaused
    };
}
