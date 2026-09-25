/**
 * Calculates the Bessel function of the first kind, J_n(x).
 * Uses high-precision numerical quadrature of the integral representation:
 * J_n(x) = (1/pi) * integral_0^pi cos(n*theta - x*sin(theta)) d_theta
 * Guarantees mathematical stability, strictly bounded in [-1, 1], with zero floating-point divergence.
 * @param n - The order of the Bessel function (MUST be an integer >= 0). Represents diametric nodal lines.
 * @param x - The radial point at which to evaluate the function.
 * @returns A float representing the amplitude of the wave at point x.
 */
export const besselJ = (n: number, x: number): number => {
    if (x === 0) return n === 0 ? 1 : 0;
    const STEPS = 32;
    const step = Math.PI / STEPS;
    let sum = 0;
    const absN = Math.abs(Math.round(n));
    for (let i = 0; i < STEPS; i++) {
        const theta = (i + 0.5) * step;
        sum += Math.cos(absN * theta - x * Math.sin(theta));
    }
    return sum / STEPS;
};

/**
 * Pre-computed roots (zeros) of the Bessel functions J_n(x) = 0.
 * Used to ensure the edge of the cymatic plate is always perfectly clamped (zero amplitude).
 * Format: BESSEL_ZEROS[n][m] where n is the order and m is the root index.
 * @warning IMMUTABLE CONSTANT. DO NOT MODIFY OR RECALCULATE AT RUNTIME.
 */
export const BESSEL_ZEROS = [
    [2.4048, 5.5201, 8.6537, 11.7915, 14.9309], // n=0
    [3.8317, 7.0156, 10.1735, 13.3237, 16.4706], // n=1
    [5.1356, 8.4172, 11.6198, 14.7960, 17.9598], // n=2
    [6.3802, 9.7610, 13.0152, 16.2235, 19.4094], // n=3
    [7.5883, 11.0647, 14.3725, 17.6160, 20.8269], // n=4
    [8.7715, 12.3386, 15.7002, 18.9801, 22.2178], // n=5
    [9.9361, 13.5893, 17.0038, 20.3208, 23.5861], // n=6
    [11.0864, 14.8213, 18.2876, 21.6415, 24.9349], // n=7
    [12.2251, 16.0378, 19.5545, 22.9452, 26.2668], // n=8
    [13.3543, 17.2412, 20.8070, 24.2339, 27.5837],  // n=9
    [14.4755, 18.4335, 22.0522, 25.5135, 28.8874], // n=10
    [15.5898, 19.6159, 23.2923, 26.7905, 30.1915], // n=11
    [16.6982, 20.7906, 24.5292, 28.0673, 31.4983]  // n=12
];