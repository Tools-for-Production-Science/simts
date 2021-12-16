export declare type DistributionType = "norm" | "uni" | "expon" | "lognorm" | "triang" | "poisson" | "";
interface dstType {
    [index: string]: DistributionType;
}
export declare class Random {
    /**
     * This variable can be used to easily choose a predefined distribution
     */
    distribution: dstType;
    drawFromProb(distribution: DistributionType, param: Array<number>): any;
    /** Random.js library.
     *
     * The code is licensed as LGPL.
    */
    N: number;
    M: number;
    MATRIX_A: number;
    UPPER_MASK: number;
    LOWER_MASK: number;
    mt: any[];
    mti: number;
    constructor(seed?: number | undefined);
    init_genrand(s: any): void;
    init_by_array(init_key: any, key_length: any): void;
    genrand_int32(): number;
    genrand_int31(): number;
    genrand_real1(): number;
    pythonCompatibility: any;
    skip: any;
    /**  generates a random number on [0,1)-real-interval */
    random(): number;
    /** generates a random number on (0,1)-real-interval */
    genrand_real3(): number;
    /** generates a random number on [0,1) with 53-bit resolution*/
    genrand_res53(): number;
    /**************************************************************************/
    LOG4: number;
    SG_MAGICCONST: number;
    exponential(lambda: any): number;
    gamma(alpha: any, beta: any): number;
    lastNormal: any;
    normal(mu: any, sigma: any): any;
    lognorm(sigma: any): number;
    pareto(alpha: any): number;
    triangular(lower: any, upper: any, mode: any): any;
    uniform(lower: any, upper: any): any;
    weibull(alpha: any, beta: any): number;
}
export {};
