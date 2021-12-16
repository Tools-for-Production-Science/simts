
export type DistributionType = "norm" | "uni" | "expon" | "lognorm" | "triang" | "poisson" | "";

interface dstType
{
    [index: string]: DistributionType;
}

export class Random
{
    //Extension by Florian Stamer

    /**
     * This variable can be used to easily choose a predefined distribution
     */
    distribution: dstType = {
        normal: "norm",
        poisson: "poisson",
        uniform: "uni",
        exponential: "expon",
        lognormal: "lognorm",
        triangular: "triang",

    }

    drawFromProb(distribution: DistributionType, param: Array<number>)
    {
        switch (distribution)
        {
            case this.distribution.normal: // Muss gelöscht werden, da dies Verteilung negative Werte herausgibt
                {
                    if (param.length != 2)
                        throw "Number of parameters didn't match distribution";

                    let r = this.normal(param[0], param[1])
                    return r;
                }
            case this.distribution.uniform: { //Done
                //https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.uniform.html#scipy.stats.uniform
                //2 Parameters
                if (param.length != 2)
                    throw "Number of parameters didn't match distribution";

                let min = param[0]; //loc
                let max = param[0] + param[1]; //loc+scale 

                let r = this.uniform(min, max)
                return r;
            }

            case this.distribution.exponential: { //DONE
                //https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.expon.html#scipy.stats.expon
                //2 Parameters
                if (param.length != 2)
                    throw "Number of parameters didn't match distribution";


                let mu = param[0]; //loc
                let lambda = 1 / param[1]; //1/scale

                let r = mu + this.exponential((lambda)); //exponential distribution in SimEngine only for one-Parameter defined //G(α;a,b) = a + bG(α;0,1) 

                return r;
            }


            case this.distribution.lognormal: { //Done
                //https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.lognorm.html#scipy.stats.lognorm
                //https://www.itl.nist.gov/div898/handbook/eda/section3/eda3669.htm
                //3 Parameters
                if (param.length != 3)
                    throw "Number of parameters didn't match distribution";


                let sigma = param[0]; //shape parameter
                let theta = param[1]; // location parameter
                let m = param[2] // scale parameter

                let r = theta + m * this.lognorm(sigma) //G(α;a,b) = a + bG(α;0,1) 
                return r;
            }

            case this.distribution.triangular: { //Done
                //https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.triang.html#scipy.stats.triang
                //3 Parameters
                if (param.length != 3)
                    throw "Number of parameters didn't match distribution";

                let min = param[1]; //loc
                let max = param[1] + param[2]; // loc + scale
                let mode = param[1] + param[0] * param[2]; //loc + c*scale

                let r = this.triangular(min, max, mode)
                return r;
            }

            case this.distribution.poisson: {
                //https://www.itl.nist.gov/div898/handbook/eda/section3/eda366j.htm
                //https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.poisson.html#scipy.stats.poisson

                /* Gutenschwager 2017. Simulation in Produktion und Logistik. S.134
                */

                if (param.length != 2)
                    throw "Number of parameters didn't match distribution";

                let loc = param[0] //mu //also called lambda
                let lambda = param[1] //loc !different position as in the continous distributions!
                let i = 0;
                let b = 1;
                let a = Math.exp(-lambda);
                do
                {
                    let g = this.uniform(0, 1);
                    b = b * g;
                    i = i + 1;
                } while (b >= a);
                return loc + i - 1;
            }
        }
        throw new Error("Distribution drawQuantity not implemented.");
    }


    /** Random.js library.
     * 
     * The code is licensed as LGPL.
    */

    /* 
       A C-program for MT19937, with initialization improved 2002/1/26.
       Coded by Takuji Nishimura and Makoto Matsumoto.
     
       Before using, initialize the state by using init_genrand(seed)  
       or init_by_array(init_key, key_length).
     
       Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
       All rights reserved.                          
     
       Redistribution and use in source and binary forms, with or without
       modification, are permitted provided that the following conditions
       are met:
    	
         1. Redistributions of source code must retain the above copyright
            notice, this list of conditions and the following disclaimer.
    	
         2. Redistributions in binary form must reproduce the above copyright
            notice, this list of conditions and the following disclaimer in the
            documentation and/or other materials provided with the distribution.
    	
         3. The names of its contributors may not be used to endorse or promote 
            products derived from this software without specific prior written 
            permission.
    	
       THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
       "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
       LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
       A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
       CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
       EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
       PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
       PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
       LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
       NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
       SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    	
    	
       Any feedback is very welcome.
       http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
       email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
     */

    N = 624;
    M = 397;
    MATRIX_A = 0x9908b0df;   /* constant vector a */
    UPPER_MASK = 0x80000000; /* most significant w-r bits */
    LOWER_MASK = 0x7fffffff; /* least significant r bits */

    mt = new Array(this.N); /* the array for the state vector */
    mti = this.N + 1; /* mti==N+1 means mt[N] is not initialized */



    constructor(seed: number | undefined = undefined)
    {
        seed = (seed === undefined) ? (new Date()).getTime() : seed;
        if (typeof (seed) !== 'number'                             // ARG_CHECK
            || Math.ceil(seed) != Math.floor(seed))
        {             // ARG_CHECK
            throw new TypeError("seed value must be an integer"); // ARG_CHECK
        }                                                         // ARG_CHECK

        //this.init_genrand(seed);
        this.init_by_array([seed], 1);
    };

    /* initializes mt[N] with a seed */
    init_genrand(s)
    {
        this.mt[0] = s >>> 0;
        for (this.mti = 1; this.mti < this.N; this.mti++)
        {
            var s;
            s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
            this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253)
                + this.mti;
            /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
            /* In the previous versions, MSBs of the seed affect   */
            /* only MSBs of the array mt[].                        */
            /* 2002/01/09 modified by Makoto Matsumoto             */
            this.mt[this.mti] >>>= 0;
            /* for >32 bit machines */
        }
    };

    /* initialize by an array with array-length */
    /* init_key is the array for initializing keys */
    /* key_length is its length */
    /* slight change for C++, 2004/2/26 */
    init_by_array(init_key, key_length)
    {
        var i, j, k;
        this.init_genrand(19650218);
        i = 1; j = 0;
        k = (this.N > key_length ? this.N : key_length);
        for (; k; k--)
        {
            var s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
                + init_key[j] + j; /* non linear */
            this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
            i++; j++;
            if (i >= this.N) { this.mt[0] = this.mt[this.N - 1]; i = 1; }
            if (j >= key_length) j = 0;
        }
        for (k = this.N - 1; k; k--)
        {
            var s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
                - i; /* non linear */
            this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
            i++;
            if (i >= this.N) { this.mt[0] = this.mt[this.N - 1]; i = 1; }
        }

        this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
    };

    /* generates a random number on [0,0xffffffff]-interval */
    genrand_int32()
    {
        var y;
        var mag01 = new Array(0x0, this.MATRIX_A);
        /* mag01[x] = x * MATRIX_A  for x=0,1 */

        if (this.mti >= this.N)
        { /* generate N words at one time */
            var kk;

            if (this.mti == this.N + 1)   /* if init_genrand() has not been called, */
                this.init_genrand(5489); /* a default initial seed is used */

            for (kk = 0; kk < this.N - this.M; kk++)
            {
                y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            for (; kk < this.N - 1; kk++)
            {
                y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
            this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

            this.mti = 0;
        }

        y = this.mt[this.mti++];

        /* Tempering */
        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >>> 18);

        return y >>> 0;
    };

    /* generates a random number on [0,0x7fffffff]-interval */
    genrand_int31()
    {
        return (this.genrand_int32() >>> 1);
    };

    /* generates a random number on [0,1]-real-interval */
    genrand_real1()
    {
        return this.genrand_int32() * (1.0 / 4294967295.0);
        /* divided by 2^32-1 */
    };
    pythonCompatibility;
    skip;
    /**  generates a random number on [0,1)-real-interval */
    random()
    {
        if (this.pythonCompatibility)
        {
            if (this.skip)
            {
                this.genrand_int32();
            }
            this.skip = true;
        }
        return this.genrand_int32() * (1.0 / 4294967296.0);
        /* divided by 2^32 */
    };

    /** generates a random number on (0,1)-real-interval */
    genrand_real3()
    {
        return (this.genrand_int32() + 0.5) * (1.0 / 4294967296.0);
        /* divided by 2^32 */
    };

    /** generates a random number on [0,1) with 53-bit resolution*/
    genrand_res53()
    {
        var a = this.genrand_int32() >>> 5, b = this.genrand_int32() >>> 6;
        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
    };

    /* These real versions are due to Isaku Wada, 2002/01/09 added */


    /**************************************************************************/
    LOG4 = Math.log(4.0);
    SG_MAGICCONST = 1.0 + Math.log(4.5);

    exponential(lambda)
    {
        if (arguments.length != 1)
        {                         // ARG_CHECK                     
            throw new SyntaxError("exponential() must "     // ARG_CHECK
                + " be called with 'lambda' parameter"); // ARG_CHECK
        }                                                   // ARG_CHECK

        var r = this.random();
        return -Math.log(r) / lambda;
    };

    gamma(alpha, beta)
    {
        if (arguments.length != 2)
        {                         // ARG_CHECK                     
            throw new SyntaxError("gamma() must be called"  // ARG_CHECK
                + " with alpha and beta parameters"); // ARG_CHECK
        }                                                   // ARG_CHECK

        /* Based on Python 2.6 source code of random.py.
         */

        if (alpha > 1.0)
        {
            var ainv = Math.sqrt(2.0 * alpha - 1.0);
            var bbb = alpha - this.LOG4;
            var ccc = alpha + ainv;

            while (true)
            {
                var u1 = this.random();
                if ((u1 < 1e-7) || (u1 > 0.9999999))
                {
                    continue;
                }
                var u2 = 1.0 - this.random();
                var v = Math.log(u1 / (1.0 - u1)) / ainv;
                var x = alpha * Math.exp(v);
                var z = u1 * u1 * u2;
                var r = bbb + ccc * v - x;
                if ((r + this.SG_MAGICCONST - 4.5 * z >= 0.0) || (r >= Math.log(z)))
                {
                    return x * beta;
                }
            }
        } else if (alpha == 1.0)
        {
            var u = this.random();
            while (u <= 1e-7)
            {
                u = this.random();
            }
            return - Math.log(u) * beta;
        } else
        {
            while (true)
            {
                var u = this.random();
                var b = (Math.E + alpha) / Math.E;
                var p = b * u;
                if (p <= 1.0)
                {
                    var x = Math.pow(p, 1.0 / alpha);
                } else
                {
                    var x = - Math.log((b - p) / alpha);
                }
                var u1 = this.random();
                if (p > 1.0)
                {
                    if (u1 <= Math.pow(x, (alpha - 1.0)))
                    {
                        break;
                    }
                } else if (u1 <= Math.exp(-x))
                {
                    break;
                }
            }
            return x * beta;
        }

    };
    lastNormal;
    normal(mu, sigma)
    {
        if (arguments.length != 2)
        {                          // ARG_CHECK                     
            throw new SyntaxError("normal() must be called"  // ARG_CHECK
                + " with mu and sigma parameters");      // ARG_CHECK
        }                                                    // ARG_CHECK

        var z = this.lastNormal;
        this.lastNormal = NaN;
        if (!z)
        {
            var a = this.random() * 2 * Math.PI;
            var b = Math.sqrt(-2.0 * Math.log(1.0 - this.random()));
            z = Math.cos(a) * b;
            this.lastNormal = Math.sin(a) * b;
        }
        return mu + z * sigma;
    };





    lognorm(sigma)
    {
        //https://www.itl.nist.gov/div898/handbook/eda/section3/eda3669.htm

        if (arguments.length != 1)
        {                         // ARG_CHECK                     
            throw new SyntaxError("lognormal() must be called" // ARG_CHECK
                + " with sigma parameters");    // ARG_CHECK
        }
        // ARG_CHECK

        //G(p)=exp(σΦ^−1(p)) //Percent Point function of lognormal distribution with Φ^−1(p) precent point function of standard normal distribution with mu = 0 and sigma = 1
        let std = 1;
        let mu = 0
        return Math.exp(sigma * this.normal(mu, std))
    };


    pareto(alpha)
    {
        if (arguments.length != 1)
        {                         // ARG_CHECK                     
            throw new SyntaxError("pareto() must be called" // ARG_CHECK
                + " with alpha parameter");             // ARG_CHECK
        }                                                   // ARG_CHECK

        var u = this.random();
        return 1.0 / Math.pow((1 - u), 1.0 / alpha);
    };

    triangular(lower, upper, mode)
    {
        // http://en.wikipedia.org/wiki/Triangular_distribution
        if (arguments.length != 3)
        {                         // ARG_CHECK                     
            throw new SyntaxError("triangular() must be called" // ARG_CHECK
                + " with lower, upper and mode parameters");    // ARG_CHECK
        }                                                   // ARG_CHECK

        var c = (mode - lower) / (upper - lower);
        var u = this.random();

        if (u <= c)
        {
            return lower + Math.sqrt(u * (upper - lower) * (mode - lower));
        } else
        {
            return upper - Math.sqrt((1 - u) * (upper - lower) * (upper - mode));
        }
    };


    uniform(lower, upper)
    {
        if (arguments.length != 2)
        {                         // ARG_CHECK                     
            throw new SyntaxError("uniform() must be called" // ARG_CHECK
                + " with lower and upper parameters");    // ARG_CHECK
        }                                                   // ARG_CHECK
        return lower + this.random() * (upper - lower);
    };

    weibull(alpha, beta)
    {
        if (arguments.length != 2)
        {                         // ARG_CHECK                     
            throw new SyntaxError("weibull() must be called" // ARG_CHECK
                + " with alpha and beta parameters");    // ARG_CHECK
        }                                                   // ARG_CHECK
        var u = 1.0 - this.random();
        return alpha * Math.pow(-Math.log(u), 1.0 / beta);
    };
}