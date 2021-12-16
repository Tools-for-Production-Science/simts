import { DateTime } from 'luxon';
import { Random, DistributionType } from './Random';
export { Random, DistributionType };
/**
 * This class implements basic handlers for neccessary simentity properties and methods
 */
export declare abstract class SimEntity implements ISimEntity {
    time(): void;
    setTimer(duration: number): Request;
    waitEvent(event: Event): Request;
    queueEvent(event: Event): Request;
    send(message: String | number, delay: number, entities: any): void;
    log(message: string | number): void;
    start(): void;
    abstract sim: Sim;
    sendMessage(): void;
}
/**
 * Interface for SimEntities
 */
export interface ISimEntity {
    time: Function;
    sim: Sim;
    start: Function;
    setTimer: (duration: number) => Request;
    waitEvent: (event: Event) => Request;
    queueEvent: (event: Event) => Request;
    send: (message: String | number, delay: number, entities: any) => void;
    sendMessage: Function;
    log: (message: string | number) => void;
}
declare namespace Sim {
    /**
     * The time base units for automatic conversion of time
     */
    type baseUnitType = "seconds" | "minutes" | "hours" | "days" | "weeks" | "months";
}
/**
 * This class handles time conversions
 */
declare class SimTiming {
    sim: Sim;
    baseUnit: Sim.baseUnitType;
    startDate: DateTime;
    constructor(sim: Sim, baseUnit?: Sim.baseUnitType, startDate?: string);
    get OneDay(): number;
    get OneYear(): number;
    /**
     * Converts a value of a specific unit into a value of sim specific unit. For example, if the simulation runs in minutes, and this function is given 1 and hour, it will return 60 minutes
     * @param value the value to convert
     * @param unit the unit of the value
     * @returns
     */
    getInBaseTime(value: number, unit: Sim.baseUnitType): number;
    getCurrentDate(): any;
    setTwoShiftModel(trigger?: boolean): void;
    setTransformator(callback: (time: number) => number): void;
    private transformator;
}
/**
 * Core class for the simulation.
 */
export declare class Sim {
    simTiming: SimTiming;
    setTimer(duration: any): Request;
    /** SIM.JS Library.
 *
 * Discrete Event Simulation in JavaScript.
 *
 * Author: Maneesh Varshney (mvarshney@gmail.com)
 * License: LGPL
 */
    simTime: number;
    entities: any[];
    queue: PQueue;
    events: number;
    endTime: number;
    entityId: number;
    pauseTrigger: boolean;
    stopTrigger: boolean;
    MLPause: boolean;
    tempSave: {
        endTime: number;
        maxEvents: number;
        isDone: boolean;
        hit: boolean;
    };
    constructor();
    time(): number;
    sendMessage: (this: any) => void;
    addEntity(proto: ISimEntity): any;
    stop(): void;
    pause(): void;
    continue(): boolean | undefined;
    continueML(): boolean;
    switch: any;
    raiser: any;
    simulate(endTime: any, maxEvents: any, isDone: any): Promise<unknown>;
    one(endTime: any, maxEvents: any, isDone: any): void;
    finish(): void;
    step(): boolean;
    finalize(): void;
    logger: any;
    setLogger(logger: any): void;
    log(message: any, entity: any): void;
}
export declare class Event {
    /** Event
     *
     */
    name: any;
    waitList: any;
    queue: any;
    isFired: any;
    constructor(name: any);
    addWaitList(ro: any): void;
    addQueue(ro: any): void;
    fire(keepFired: any): void;
    clear(): void;
}
declare class Request {
    /** Request
 *
 */
    entity: any;
    scheduledAt: any;
    deliverAt: any;
    callbacks: any;
    cancelled: any;
    group: any;
    noRenege: any;
    source: any;
    constructor(entity: any, currentTime: any, deliverAt: any);
    cancel(): any;
    done(callback: Function, context?: any, argument?: any): this;
    waitUntil(delay: any, callback: any, context: any, argument: any): this;
    unlessEvent(event: any, callback: any, context: any, argument: any): this;
    data: any;
    msg: any;
    setData(data: any): this;
    deliver(): void;
    cancelRenegeClauses(): void;
    Null(): this;
    _addRequest(deliverAt: any, callback: any, context: any, argument: any): Request;
    _doCallback(source: any, msg: any, data: any): void;
}
export declare class PQueue {
    /** Priority Queue. Uses binary heap.
     *
     * This is not a general purpose priority queue. It is custom made for
     * Request object. Request.deliverAt is the key.
     */
    data: any;
    order: any;
    constructor();
    greater(ro1: any, ro2: any): boolean;
    insert(ro: any): void;
    remove(): any;
}
