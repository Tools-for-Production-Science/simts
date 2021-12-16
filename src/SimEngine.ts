/* The following applies to the original code
The MIT License (MIT)

Copyright (c) 2016 Maneesh Varshney

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
*/

/* The following applies to the code modifications
The MIT License (MIT)

Copyright (c) 2021 Florian Stamer

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
*/

import { Duration, DateTime } from 'luxon';
import {Random, DistributionType} from './Random'

export {Random, DistributionType};
/**
 * This class implements basic handlers for neccessary simentity properties and methods
 */
export abstract class SimEntity implements ISimEntity
{
    //dummyFunctions for implementation of SImEntity Interface; This will be overwritten, when object is added as Entity to SimEngine
    time() { throw new Error("Object was not added as entity to simulation engine"); };
    setTimer(duration: number): Request { throw new Error("Object was not added as entity to simulation engine"); };
    waitEvent(event: Event): Request { throw new Error("Object was not added as entity to simulation engine"); };
    queueEvent(event: Event): Request { throw new Error("Object was not added as entity to simulation engine"); };
    send(message: String | number, delay: number, entities) { throw new Error("Object was not added as entity to simulation engine"); };
    log(message: string | number) { throw new Error("Object was not added as entity to simulation engine"); };
    start() { };
    abstract sim: Sim;
    sendMessage() { };
}
/**
 * Interface for SimEntities
 */
export interface ISimEntity
{
    time: Function;
    sim: Sim;
    start: Function;

    setTimer: (duration: number) => Request;

    waitEvent: (event: Event) => Request;

    queueEvent: (event: Event) => Request;

    send: (message: String | number, delay: number, entities) => void;
    sendMessage: Function;
    log: (message: string | number) => void;
}

namespace Sim
{
    /**
     * The time base units for automatic conversion of time
     */
    export type baseUnitType = "seconds" | "minutes" | "hours" | "days" | "weeks" | "months";
}
/**
 * This class handles time conversions
 */
class SimTiming
{
    sim: Sim;

    baseUnit: Sim.baseUnitType = "minutes";
    startDate: DateTime;

    constructor(sim: Sim, baseUnit: Sim.baseUnitType = "minutes", startDate = "")
    {
        if (startDate == "")
            this.startDate = DateTime.now().setLocale("de");
        else
            this.startDate = DateTime.fromFormat(startDate, 'dd.MM.yyyy');

        this.baseUnit = baseUnit;
        this.sim = sim;
    }
    public get OneDay(): number
    {
        return Duration.fromObject({ "days": 1 }).as(this.baseUnit);;
    }

    public get OneYear(): number
    {
        return Duration.fromObject({ "years": 1 }).as(this.baseUnit);;
    }

    /**
     * Converts a value of a specific unit into a value of sim specific unit. For example, if the simulation runs in minutes, and this function is given 1 and hour, it will return 60 minutes
     * @param value the value to convert
     * @param unit the unit of the value
     * @returns 
     */
    public getInBaseTime(value: number, unit: Sim.baseUnitType): number
    {
        let obj = {};
        obj[unit] = value;
        return this.transformator(Duration.fromObject(obj).as(this.baseUnit));
    }

    public getCurrentDate()
    {
        let obj = {};
        obj[this.baseUnit] = this.transformator(this.sim.time());
        return this.startDate.plus(obj).toFormat("hh:mm:ss dd.MM.yyyy");
    }

    public setTwoShiftModel(trigger = true)
    {
        if (trigger)
            this.setTransformator((time) => { return time * 2 / 3; })
        else
            this.setTransformator((time) => { return time; })
    }

    public setTransformator(callback: (time: number) => number)
    {
        this.transformator = callback;
    }

    private transformator(time: number): number
    {
        return time;
    }
}

/**
 * Core class for the simulation. 
 */
export class Sim
{
    //Extension by FS
    simTiming = new SimTiming(this);

    setTimer(duration)
    {
        (ARG_CHECK as any)(arguments, 1, 1);

        var ro = new Request(
            this,
            this.time(),
            this.time() + duration);

        this.queue.insert(ro);
        return ro;
    };

    /** SIM.JS Library.
 * 
 * Discrete Event Simulation in JavaScript.
 * 
 * Author: Maneesh Varshney (mvarshney@gmail.com)
 * License: LGPL
 */

    //Simulator Object

    simTime = 0;
    entities = new Array();
    queue = new PQueue();
    events = 0;
    endTime = 0;
    entityId = 1;

    pauseTrigger = false;
    stopTrigger = false;
    MLPause = false;
    tempSave = { endTime: 0, maxEvents: 0, isDone: false, hit:false };

    constructor()
    {
        this.simTime = 0;
        this.entities = new Array();
        this.queue = new PQueue();
        this.events = 0;
        this.endTime = 0;
        this.entityId = 1;
        this.pauseTrigger = false;
        this.MLPause = false;
        this.tempSave = { endTime: 0, maxEvents: 0, isDone: false, hit:false  };
    }

    time()
    {
        return this.simTime;
    };

    sendMessage = function (this: any)
    {

        var sender = this.source;
        var message = this.msg;
        var entities = this.data;
        var sim = sender.sim;

        if (!entities)
        {
            // send to all entities
            for (var i = sim.entities.length - 1; i >= 0; i--)
            {
                var entity = sim.entities[i];
                if (entity === sender) continue;
                if (entity.onMessage) entity.onMessage.call(entity, sender, message);
            }
        } else if (entities instanceof Array)
        {
            for (var i = entities.length - 1; i >= 0; i--)
            {
                var entity = entities[i];
                if (entity === sender) continue;
                if (entity.onMessage) entity.onMessage.call(entity, sender, message);
            }
        } else
        {
            if (entities.onMessage)
            {
                entities.onMessage.call(entities, sender, message);
            }
        }
    };

    addEntity(proto: ISimEntity)
    {
        //(ARG_CHECK as any)(arguments, 1, 1, Object);
        // Verify that prototype has start function
        if (!proto.start)
        {  // ARG CHECK
            throw new Error("Entity prototype must have start() function defined"); // ARG CHECK
        }  // ARG CHECK

        proto.time = function ()
        {
            return this.sim.time();
        };

        proto.setTimer = function (duration)
        {
            (ARG_CHECK as any)(arguments, 1, 1);

            var ro = new Request(
                this,
                this.sim.time(),
                this.sim.time() + duration);

            this.sim.queue.insert(ro);
            return ro;
        };

        proto.waitEvent = function (event)
        {
            (ARG_CHECK as any)(arguments, 1, 1, Event);

            var ro = new Request(this, this.sim.time(), 0);

            ro.source = event;
            event.addWaitList(ro);
            return ro;
        };

        proto.queueEvent = function (event)
        {
            (ARG_CHECK as any)(arguments, 1, 1, Event);

            var ro = new Request(this, this.sim.time(), 0);

            ro.source = event;
            event.addQueue(ro);
            return ro;
        };

        proto.send = function (message, delay, entities)
        {
            (ARG_CHECK as any)(arguments, 2, 3);

            var ro = new Request(this.sim, this.time(), this.time() + delay);
            ro.source = this;
            ro.msg = message;
            ro.data = entities;
            ro.deliver = this.sim.sendMessage;

            this.sim.queue.insert(ro);
        };

        proto.log = function (message)
        {
            (ARG_CHECK as any)(arguments, 1, 1);

            this.sim.log(message, this);
        };
        //}

        var obj = (function (p)
        {
            if (p == null) throw TypeError();
            if (Object.create)
                return Object.create(p);
            var t = typeof p;
            if (t !== "object" && t !== "function") throw TypeError();

            function f() { };
            f.prototype = p;
            return new f();
        }(proto));

        obj.sim = this;
        obj.id = this.entityId++;
        this.entities.push(obj);

        if (arguments.length > 1)
        {
            var args = new Array();
            for (var i = 1; i < arguments.length; i++)
            {
                args.push(arguments[i]);
            }
            obj.start.apply(obj, args);
        }
        else
        {
            obj.start();
        }


        return obj;
    };

    stop()
    {
        this.stopTrigger = true;
    }

    pause()
    {
        this.pauseTrigger = true;
    }
    continue()
    {
        if (this.pauseTrigger)
        {
            this.pauseTrigger = false;
            if (!this.MLPause && this.tempSave.hit)
            {
                this.tempSave.hit = false;
                setImmediate(() => { this.one(this.tempSave.endTime, this.tempSave.maxEvents, this.tempSave.isDone); })
                return true;
            }
            else
                return false;
        }
    }

    continueML()
    {
        this.MLPause = false;
        if (!this.pauseTrigger && this.tempSave.hit)
        {
            this.tempSave.hit = false;
            setImmediate(() => { this.one(this.tempSave.endTime, this.tempSave.maxEvents, this.tempSave.isDone); })
            return true;
        }
        return false;
    }
    switch;
    raiser;
    simulate(endTime, maxEvents, isDone)
    {

        /*if (this.pauseTrigger || this.MLPause)
            return new Promise((resolve) => { that.switch = resolve;});
*/
        if (!maxEvents || maxEvents < 0) { maxEvents = Infinity; }
        this.events = 0;
        const that = this;
        this.tempSave.endTime = endTime;
        this.tempSave.maxEvents = maxEvents;
        this.tempSave.isDone = isDone;
        let p = new Promise((resolve, reject) =>
        {
            that.switch = resolve;
            that.raiser = reject;
        })
        setImmediate(() => { this.one(endTime, maxEvents, isDone); })
        return p;
    };

    one(endTime, maxEvents, isDone)
    {
        try
        {
            if (this.pauseTrigger || this.MLPause)
            {
                this.tempSave.endTime = endTime;
                this.tempSave.maxEvents = maxEvents;
                this.tempSave.isDone = isDone;
                this.tempSave.hit = true;
                return;
            }

            if (this.stopTrigger)
            {
                this.finish();
                return;
            }

            this.events++;

            if (this.events > maxEvents)
            {
                this.finish();
                return;
            }

            // Get the earliest event
            var ro = this.queue.remove();

            // If there are no more events, we are done with simulation here.
            if (ro == undefined)
            {
                this.finish();
                return;
            }


            // Uh oh.. we are out of time now
            if (ro.deliverAt > endTime && endTime >= 0)
            {
                this.finish();
                return;
            }
            //If Function is defined to break at specific state, this will return true
            if (isDone)
            {
                this.finish();
                return;
            }
            // Advance simulation time
            this.simTime = ro.deliverAt;

            // If this event is already cancelled, ignore
            if (ro.cancelled)
            {
                setImmediate(() => { this.one(endTime, maxEvents, isDone); });
                return;
            }

            ro.deliver();
        }
        catch (e)
        {
            this.raiser(e);
            return;
        }

        setImmediate(() => { this.one(endTime, maxEvents, isDone); })
    }

    finish()
    {
        this.queue.data.length = 0;
        this.finalize();
        this.switch(0);
        return;
    }

    step()
    {
        while (true)
        {
            var ro = this.queue.remove();
            if (!ro) return false;
            this.simTime = ro.deliverAt;
            if (ro.cancelled) continue;
            ro.deliver();
            break;
        }
        return true;
    };

    finalize()
    {
        for (var i = 0; i < this.entities.length; i++)
        {
            if (this.entities[i].finalize)
            {
                this.entities[i].finalize();
            }
        }
    };
    logger;
    setLogger(logger)
    {
        (ARG_CHECK as any)(arguments, 1, 1, Function);
        this.logger = logger;
    };

    log(message, entity)
    {
        (ARG_CHECK as any)(arguments, 1, 2);

        if (!this.logger) return;
        var entityMsg = "";
        if (entity !== undefined)
        {
            if (entity.name)
            {
                entityMsg = " [" + entity.name + "]";
            } else
            {
                entityMsg = " [" + entity.id + "] ";
            }
        }
        this.logger(this.simTime.toFixed(6)
            + entityMsg
            + "   "
            + message);
    };
}


function ARG_CHECK(found, expMin, expMax)
{
    if (found.length < expMin || found.length > expMax)
    {   // ARG_CHECK
        throw new Error("Incorrect number of arguments");   // ARG_CHECK
    }   // ARG_CHECK


    for (var i = 0; i < found.length; i++)
    {   // ARG_CHECK
        if (!arguments[i + 3] || !found[i]) continue;   // ARG_CHECK

        if (!(found[i] instanceof arguments[i + 3]))
        {   // ARG_CHECK
            throw new Error("parameter " + (i + 1) + " is of incorrect type.");   // ARG_CHECK
        }   // ARG_CHECK
    }   // ARG_CHECK
}   // ARG_CHECK

export class Event
{
    /** Event
     * 
     */

    name;
    waitList;
    queue;
    isFired;

    constructor(name)
    {
        (ARG_CHECK as any)(arguments, 0, 1);

        this.name = name;
        this.waitList = new Array();
        this.queue = new Array();
        this.isFired = false;
    };

    addWaitList(ro)
    {
        (ARG_CHECK as any)(arguments, 1, 1);

        if (this.isFired)
        {
            ro.deliverAt = ro.entity.time();
            ro.entity.sim.queue.insert(ro);
            return;
        }
        this.waitList.push(ro);
    };

    addQueue(ro)
    {
        (ARG_CHECK as any)(arguments, 1, 1);

        if (this.isFired)
        {
            ro.deliverAt = ro.entity.time();
            ro.entity.sim.queue.insert(ro);
            return;
        }
        this.queue.push(ro);
    };

    fire(keepFired)
    {
        (ARG_CHECK as any)(arguments, 0, 1);

        if (keepFired)
        {
            this.isFired = true;
        }

        // Dispatch all waiting entities
        var tmpList = this.waitList;
        this.waitList = [];
        for (var i = 0; i < tmpList.length; i++)
        {
            tmpList[i].deliver();
        }

        // Dispatch one queued entity
        var lucky = this.queue.shift();
        if (lucky)
        {
            lucky.deliver();
        }
    };

    clear()
    {
        this.isFired = false;
    };
}
class Request
{
    /** Request
 * 
 */
    entity;
    scheduledAt;
    deliverAt;
    callbacks;
    cancelled;
    group;
    noRenege;
    source;

    // Public API
    constructor(entity, currentTime, deliverAt)
    {
        this.entity = entity;
        this.scheduledAt = currentTime;
        this.deliverAt = deliverAt;
        this.callbacks = [];
        this.cancelled = false;
        this.group = null;
    };

    cancel()
    {
        // Ask the main request to handle cancellation
        if (this.group && this.group[0] != this)
        {
            return this.group[0].cancel();
        }

        // --> this is main request
        if (this.noRenege) return this;

        // if already cancelled, do nothing
        if (this.cancelled) return;

        // set flag
        this.cancelled = true;

        if (this.deliverAt == 0)
        {
            this.deliverAt = this.entity.time();
        }
/*
        if (this.source)
        {
            if ((this.source instanceof Buffer)
                || (this.source instanceof Store))
            {
                this.source.progressPutQueue.call(this.source);
                this.source.progressGetQueue.call(this.source);
            }
        }
*/
        if (!this.group)
        {
            return;
        }
        for (var i = 1; i < this.group.length; i++)
        {
            this.group[i].cancelled = true;
            if (this.group[i].deliverAt == 0)
            {
                this.group[i].deliverAt = this.entity.time();
            }
        }
    };

    done(callback: Function, context: any = null, argument: any = null)
    {
        (ARG_CHECK as any)(arguments, 0, 3, Function, Object);

        this.callbacks.push([callback, context, argument]);
        return this;
    };

    waitUntil(delay, callback, context, argument)
    {
        (ARG_CHECK as any)(arguments, 1, 4, undefined, Function, Object);
        if (this.noRenege) return this;

        var ro = this._addRequest(this.scheduledAt + delay, callback, context, argument);
        this.entity.sim.queue.insert(ro);
        return this;
    };


    unlessEvent(event, callback, context, argument)
    {
        (ARG_CHECK as any)(arguments, 1, 4, undefined, Function, Object);
        if (this.noRenege) return this;

        if (event instanceof Event)
        {
            var ro = this._addRequest(0, callback, context, argument);
            ro.msg = event;
            event.addWaitList(ro);

        } else if (event instanceof Array)
        {
            for (var i = 0; i < event.length; i++)
            {
                var ro = this._addRequest(0, callback, context, argument);
                ro.msg = event[i];
                event[i].addWaitList(ro);
            }
        }

        return this;
    };
    data;
    msg;
    setData(data)
    {
        this.data = data;
        return this;
    };

    // Non Public API
    deliver()
    {
        if (this.cancelled) return;
        this.cancel();
        if (!this.callbacks) return;

        if (this.group && this.group.length > 0)
        {
            this._doCallback(this.group[0].source,
                this.msg,
                this.group[0].data);
        } else
        {
            this._doCallback(this.source,
                this.msg,
                this.data);
        }

    };

    cancelRenegeClauses()
    {
        //this.cancel = this.Null;
        //this.waitUntil = this.Null;
        //this.unlessEvent = this.Null;
        this.noRenege = true;

        if (!this.group || this.group[0] != this)
        {
            return;
        }

        for (var i = 1; i < this.group.length; i++)
        {
            this.group[i].cancelled = true;
            if (this.group[i].deliverAt == 0)
            {
                this.group[i].deliverAt = this.entity.time();
            }
        }
    };

    Null()
    {
        return this;
    };

    // Private API
    _addRequest(deliverAt, callback, context, argument)
    {
        var ro = new Request(
            this.entity,
            this.scheduledAt,
            deliverAt);

        ro.callbacks.push([callback, context, argument]);

        if (this.group === null)
        {
            this.group = [this];
        }

        this.group.push(ro);
        ro.group = this.group;
        return ro;
    };

    _doCallback(source, msg, data)
    {
        for (var i = 0; i < this.callbacks.length; i++)
        {
            var callback = this.callbacks[i][0];
            if (!callback) continue;

            var context = this.callbacks[i][1];
            if (!context) context = this.entity;

            var argument = this.callbacks[i][2];

            context.callbackSource = source;
            context.callbackMessage = msg;
            context.callbackData = data;

            if (!argument)
            {
                callback.call(context);
            } else if (argument instanceof Array)
            {
                callback.apply(context, argument);
            } else
            {
                callback.call(context, argument);
            }

            context.callbackSource = null;
            context.callbackMessage = null;
            context.callbackData = null;
        }
    };
}
export class PQueue
{
    /** Priority Queue. Uses binary heap.
     *
     * This is not a general purpose priority queue. It is custom made for
     * Request object. Request.deliverAt is the key.
     */

    data;
    order;

    constructor()
    {
        this.data = [];
        this.order = 0;
    };

    greater(ro1, ro2)
    {
        if (ro1.deliverAt > ro2.deliverAt) return true;
        if (ro1.deliverAt == ro2.deliverAt)
            return ro1.order > ro2.order;
        return false;
    };


    /* Root at index 0
     * Parent (i) = Math.floor((i-1) / 2)
     * Left (i) = 2i + 1
     * Right (i) = 2i + 2
     */

    insert(ro)
    {
        (ARG_CHECK as any)(arguments, 1, 1);
        ro.order = this.order++;

        var index = this.data.length;
        this.data.push(ro);

        // insert into data at the end
        var a = this.data;
        var node = a[index];

        // heap up
        while (index > 0)
        {
            var parentIndex = Math.floor((index - 1) / 2);
            if (this.greater(a[parentIndex], ro))
            {
                a[index] = a[parentIndex];
                index = parentIndex;
            } else
            {
                break;
            }
        }
        a[index] = node;
    };

    remove()
    {
        var a = this.data;
        var len = a.length;
        if (len <= 0)
        {
            return undefined;
        }
        if (len == 1)
        {
            return this.data.pop();
        }
        var top = a[0];
        // move the last node up
        a[0] = a.pop();
        len--;

        // heap down
        var index = 0;
        var node = a[index];

        while (index < Math.floor(len / 2))
        {
            var leftChildIndex = 2 * index + 1;
            var rightChildIndex = 2 * index + 2;

            var smallerChildIndex = rightChildIndex < len
                && !this.greater(a[rightChildIndex], a[leftChildIndex])
                ? rightChildIndex : leftChildIndex;

            if (this.greater(a[smallerChildIndex], node))
            {
                break;
            }

            a[index] = a[smallerChildIndex];
            index = smallerChildIndex;
        }
        a[index] = node;
        return top;
    };


}




