"use strict";
/* The following applies to the original code
The MIT License (MIT)

Copyright (c) 2016 Maneesh Varshney

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.PQueue = exports.Event = exports.Sim = exports.SimEntity = exports.Random = void 0;
/* The following applies to the code modifications
The MIT License (MIT)

Copyright (c) 2021 Florian Stamer

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
*/
var luxon_1 = require("luxon");
var Random_1 = require("./Random");
Object.defineProperty(exports, "Random", { enumerable: true, get: function () { return Random_1.Random; } });
/**
 * This class implements basic handlers for neccessary simentity properties and methods
 */
var SimEntity = /** @class */ (function () {
    function SimEntity() {
    }
    //dummyFunctions for implementation of SImEntity Interface; This will be overwritten, when object is added as Entity to SimEngine
    SimEntity.prototype.time = function () { throw new Error("Object was not added as entity to simulation engine"); };
    ;
    SimEntity.prototype.setTimer = function (duration) { throw new Error("Object was not added as entity to simulation engine"); };
    ;
    SimEntity.prototype.waitEvent = function (event) { throw new Error("Object was not added as entity to simulation engine"); };
    ;
    SimEntity.prototype.queueEvent = function (event) { throw new Error("Object was not added as entity to simulation engine"); };
    ;
    SimEntity.prototype.send = function (message, delay, entities) { throw new Error("Object was not added as entity to simulation engine"); };
    ;
    SimEntity.prototype.log = function (message) { throw new Error("Object was not added as entity to simulation engine"); };
    ;
    SimEntity.prototype.start = function () { };
    ;
    SimEntity.prototype.sendMessage = function () { };
    ;
    return SimEntity;
}());
exports.SimEntity = SimEntity;
/**
 * This class handles time conversions
 */
var SimTiming = /** @class */ (function () {
    function SimTiming(sim, baseUnit, startDate) {
        if (baseUnit === void 0) { baseUnit = "minutes"; }
        if (startDate === void 0) { startDate = ""; }
        this.baseUnit = "minutes";
        if (startDate == "")
            this.startDate = luxon_1.DateTime.now().setLocale("de");
        else
            this.startDate = luxon_1.DateTime.fromFormat(startDate, 'dd.MM.yyyy');
        this.baseUnit = baseUnit;
        this.sim = sim;
    }
    Object.defineProperty(SimTiming.prototype, "OneDay", {
        get: function () {
            return luxon_1.Duration.fromObject({ "days": 1 }).as(this.baseUnit);
            ;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SimTiming.prototype, "OneYear", {
        get: function () {
            return luxon_1.Duration.fromObject({ "years": 1 }).as(this.baseUnit);
            ;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Converts a value of a specific unit into a value of sim specific unit. For example, if the simulation runs in minutes, and this function is given 1 and hour, it will return 60 minutes
     * @param value the value to convert
     * @param unit the unit of the value
     * @returns
     */
    SimTiming.prototype.getInBaseTime = function (value, unit) {
        var obj = {};
        obj[unit] = value;
        return this.transformator(luxon_1.Duration.fromObject(obj).as(this.baseUnit));
    };
    SimTiming.prototype.getCurrentDate = function () {
        var obj = {};
        obj[this.baseUnit] = this.transformator(this.sim.time());
        return this.startDate.plus(obj).toFormat("hh:mm:ss dd.MM.yyyy");
    };
    SimTiming.prototype.setTwoShiftModel = function (trigger) {
        if (trigger === void 0) { trigger = true; }
        if (trigger)
            this.setTransformator(function (time) { return time * 2 / 3; });
        else
            this.setTransformator(function (time) { return time; });
    };
    SimTiming.prototype.setTransformator = function (callback) {
        this.transformator = callback;
    };
    SimTiming.prototype.transformator = function (time) {
        return time;
    };
    return SimTiming;
}());
/**
 * Core class for the simulation.
 */
var Sim = /** @class */ (function () {
    function Sim() {
        //Extension by FS
        this.simTiming = new SimTiming(this);
        /** SIM.JS Library.
     *
     * Discrete Event Simulation in JavaScript.
     *
     * Author: Maneesh Varshney (mvarshney@gmail.com)
     * License: LGPL
     */
        //Simulator Object
        this.simTime = 0;
        this.entities = new Array();
        this.queue = new PQueue();
        this.events = 0;
        this.endTime = 0;
        this.entityId = 1;
        this.pauseTrigger = false;
        this.stopTrigger = false;
        this.MLPause = false;
        this.tempSave = { endTime: 0, maxEvents: 0, isDone: false, hit: false };
        this.sendMessage = function () {
            var sender = this.source;
            var message = this.msg;
            var entities = this.data;
            var sim = sender.sim;
            if (!entities) {
                // send to all entities
                for (var i = sim.entities.length - 1; i >= 0; i--) {
                    var entity = sim.entities[i];
                    if (entity === sender)
                        continue;
                    if (entity.onMessage)
                        entity.onMessage.call(entity, sender, message);
                }
            }
            else if (entities instanceof Array) {
                for (var i = entities.length - 1; i >= 0; i--) {
                    var entity = entities[i];
                    if (entity === sender)
                        continue;
                    if (entity.onMessage)
                        entity.onMessage.call(entity, sender, message);
                }
            }
            else {
                if (entities.onMessage) {
                    entities.onMessage.call(entities, sender, message);
                }
            }
        };
        this.simTime = 0;
        this.entities = new Array();
        this.queue = new PQueue();
        this.events = 0;
        this.endTime = 0;
        this.entityId = 1;
        this.pauseTrigger = false;
        this.MLPause = false;
        this.tempSave = { endTime: 0, maxEvents: 0, isDone: false, hit: false };
    }
    Sim.prototype.setTimer = function (duration) {
        ARG_CHECK(arguments, 1, 1);
        var ro = new Request(this, this.time(), this.time() + duration);
        this.queue.insert(ro);
        return ro;
    };
    ;
    Sim.prototype.time = function () {
        return this.simTime;
    };
    ;
    Sim.prototype.addEntity = function (proto) {
        //(ARG_CHECK as any)(arguments, 1, 1, Object);
        // Verify that prototype has start function
        if (!proto.start) { // ARG CHECK
            throw new Error("Entity prototype must have start() function defined"); // ARG CHECK
        } // ARG CHECK
        proto.time = function () {
            return this.sim.time();
        };
        proto.setTimer = function (duration) {
            ARG_CHECK(arguments, 1, 1);
            var ro = new Request(this, this.sim.time(), this.sim.time() + duration);
            this.sim.queue.insert(ro);
            return ro;
        };
        proto.waitEvent = function (event) {
            ARG_CHECK(arguments, 1, 1, Event);
            var ro = new Request(this, this.sim.time(), 0);
            ro.source = event;
            event.addWaitList(ro);
            return ro;
        };
        proto.queueEvent = function (event) {
            ARG_CHECK(arguments, 1, 1, Event);
            var ro = new Request(this, this.sim.time(), 0);
            ro.source = event;
            event.addQueue(ro);
            return ro;
        };
        proto.send = function (message, delay, entities) {
            ARG_CHECK(arguments, 2, 3);
            var ro = new Request(this.sim, this.time(), this.time() + delay);
            ro.source = this;
            ro.msg = message;
            ro.data = entities;
            ro.deliver = this.sim.sendMessage;
            this.sim.queue.insert(ro);
        };
        proto.log = function (message) {
            ARG_CHECK(arguments, 1, 1);
            this.sim.log(message, this);
        };
        //}
        var obj = (function (p) {
            if (p == null)
                throw TypeError();
            if (Object.create)
                return Object.create(p);
            var t = typeof p;
            if (t !== "object" && t !== "function")
                throw TypeError();
            function f() { }
            ;
            f.prototype = p;
            return new f();
        }(proto));
        obj.sim = this;
        obj.id = this.entityId++;
        this.entities.push(obj);
        if (arguments.length > 1) {
            var args = new Array();
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            obj.start.apply(obj, args);
        }
        else {
            obj.start();
        }
        return obj;
    };
    ;
    Sim.prototype.stop = function () {
        this.stopTrigger = true;
    };
    Sim.prototype.pause = function () {
        this.pauseTrigger = true;
    };
    Sim.prototype.continue = function () {
        var _this = this;
        if (this.pauseTrigger) {
            this.pauseTrigger = false;
            if (!this.MLPause && this.tempSave.hit) {
                this.tempSave.hit = false;
                setImmediate(function () { _this.one(_this.tempSave.endTime, _this.tempSave.maxEvents, _this.tempSave.isDone); });
                return true;
            }
            else
                return false;
        }
    };
    Sim.prototype.continueML = function () {
        var _this = this;
        this.MLPause = false;
        if (!this.pauseTrigger && this.tempSave.hit) {
            this.tempSave.hit = false;
            setImmediate(function () { _this.one(_this.tempSave.endTime, _this.tempSave.maxEvents, _this.tempSave.isDone); });
            return true;
        }
        return false;
    };
    Sim.prototype.simulate = function (endTime, maxEvents, isDone) {
        var _this = this;
        /*if (this.pauseTrigger || this.MLPause)
            return new Promise((resolve) => { that.switch = resolve;});
*/
        if (!maxEvents || maxEvents < 0) {
            maxEvents = Infinity;
        }
        this.events = 0;
        var that = this;
        this.tempSave.endTime = endTime;
        this.tempSave.maxEvents = maxEvents;
        this.tempSave.isDone = isDone;
        var p = new Promise(function (resolve, reject) {
            that.switch = resolve;
            that.raiser = reject;
        });
        setImmediate(function () { _this.one(endTime, maxEvents, isDone); });
        return p;
    };
    ;
    Sim.prototype.one = function (endTime, maxEvents, isDone) {
        var _this = this;
        try {
            if (this.pauseTrigger || this.MLPause) {
                this.tempSave.endTime = endTime;
                this.tempSave.maxEvents = maxEvents;
                this.tempSave.isDone = isDone;
                this.tempSave.hit = true;
                return;
            }
            if (this.stopTrigger) {
                this.finish();
                return;
            }
            this.events++;
            if (this.events > maxEvents) {
                this.finish();
                return;
            }
            // Get the earliest event
            var ro = this.queue.remove();
            // If there are no more events, we are done with simulation here.
            if (ro == undefined) {
                this.finish();
                return;
            }
            // Uh oh.. we are out of time now
            if (ro.deliverAt > endTime && endTime >= 0) {
                this.finish();
                return;
            }
            //If Function is defined to break at specific state, this will return true
            if (isDone) {
                this.finish();
                return;
            }
            // Advance simulation time
            this.simTime = ro.deliverAt;
            // If this event is already cancelled, ignore
            if (ro.cancelled) {
                setImmediate(function () { _this.one(endTime, maxEvents, isDone); });
                return;
            }
            ro.deliver();
        }
        catch (e) {
            this.raiser(e);
            return;
        }
        setImmediate(function () { _this.one(endTime, maxEvents, isDone); });
    };
    Sim.prototype.finish = function () {
        this.queue.data.length = 0;
        this.finalize();
        this.switch(0);
        return;
    };
    Sim.prototype.step = function () {
        while (true) {
            var ro = this.queue.remove();
            if (!ro)
                return false;
            this.simTime = ro.deliverAt;
            if (ro.cancelled)
                continue;
            ro.deliver();
            break;
        }
        return true;
    };
    ;
    Sim.prototype.finalize = function () {
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].finalize) {
                this.entities[i].finalize();
            }
        }
    };
    ;
    Sim.prototype.setLogger = function (logger) {
        ARG_CHECK(arguments, 1, 1, Function);
        this.logger = logger;
    };
    ;
    Sim.prototype.log = function (message, entity) {
        ARG_CHECK(arguments, 1, 2);
        if (!this.logger)
            return;
        var entityMsg = "";
        if (entity !== undefined) {
            if (entity.name) {
                entityMsg = " [" + entity.name + "]";
            }
            else {
                entityMsg = " [" + entity.id + "] ";
            }
        }
        this.logger(this.simTime.toFixed(6)
            + entityMsg
            + "   "
            + message);
    };
    ;
    return Sim;
}());
exports.Sim = Sim;
function ARG_CHECK(found, expMin, expMax) {
    if (found.length < expMin || found.length > expMax) { // ARG_CHECK
        throw new Error("Incorrect number of arguments"); // ARG_CHECK
    } // ARG_CHECK
    for (var i = 0; i < found.length; i++) { // ARG_CHECK
        if (!arguments[i + 3] || !found[i])
            continue; // ARG_CHECK
        if (!(found[i] instanceof arguments[i + 3])) { // ARG_CHECK
            throw new Error("parameter " + (i + 1) + " is of incorrect type."); // ARG_CHECK
        } // ARG_CHECK
    } // ARG_CHECK
} // ARG_CHECK
var Event = /** @class */ (function () {
    function Event(name) {
        ARG_CHECK(arguments, 0, 1);
        this.name = name;
        this.waitList = new Array();
        this.queue = new Array();
        this.isFired = false;
    }
    ;
    Event.prototype.addWaitList = function (ro) {
        ARG_CHECK(arguments, 1, 1);
        if (this.isFired) {
            ro.deliverAt = ro.entity.time();
            ro.entity.sim.queue.insert(ro);
            return;
        }
        this.waitList.push(ro);
    };
    ;
    Event.prototype.addQueue = function (ro) {
        ARG_CHECK(arguments, 1, 1);
        if (this.isFired) {
            ro.deliverAt = ro.entity.time();
            ro.entity.sim.queue.insert(ro);
            return;
        }
        this.queue.push(ro);
    };
    ;
    Event.prototype.fire = function (keepFired) {
        ARG_CHECK(arguments, 0, 1);
        if (keepFired) {
            this.isFired = true;
        }
        // Dispatch all waiting entities
        var tmpList = this.waitList;
        this.waitList = [];
        for (var i = 0; i < tmpList.length; i++) {
            tmpList[i].deliver();
        }
        // Dispatch one queued entity
        var lucky = this.queue.shift();
        if (lucky) {
            lucky.deliver();
        }
    };
    ;
    Event.prototype.clear = function () {
        this.isFired = false;
    };
    ;
    return Event;
}());
exports.Event = Event;
var Request = /** @class */ (function () {
    // Public API
    function Request(entity, currentTime, deliverAt) {
        this.entity = entity;
        this.scheduledAt = currentTime;
        this.deliverAt = deliverAt;
        this.callbacks = [];
        this.cancelled = false;
        this.group = null;
    }
    ;
    Request.prototype.cancel = function () {
        // Ask the main request to handle cancellation
        if (this.group && this.group[0] != this) {
            return this.group[0].cancel();
        }
        // --> this is main request
        if (this.noRenege)
            return this;
        // if already cancelled, do nothing
        if (this.cancelled)
            return;
        // set flag
        this.cancelled = true;
        if (this.deliverAt == 0) {
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
        if (!this.group) {
            return;
        }
        for (var i = 1; i < this.group.length; i++) {
            this.group[i].cancelled = true;
            if (this.group[i].deliverAt == 0) {
                this.group[i].deliverAt = this.entity.time();
            }
        }
    };
    ;
    Request.prototype.done = function (callback, context, argument) {
        if (context === void 0) { context = null; }
        if (argument === void 0) { argument = null; }
        ARG_CHECK(arguments, 0, 3, Function, Object);
        this.callbacks.push([callback, context, argument]);
        return this;
    };
    ;
    Request.prototype.waitUntil = function (delay, callback, context, argument) {
        ARG_CHECK(arguments, 1, 4, undefined, Function, Object);
        if (this.noRenege)
            return this;
        var ro = this._addRequest(this.scheduledAt + delay, callback, context, argument);
        this.entity.sim.queue.insert(ro);
        return this;
    };
    ;
    Request.prototype.unlessEvent = function (event, callback, context, argument) {
        ARG_CHECK(arguments, 1, 4, undefined, Function, Object);
        if (this.noRenege)
            return this;
        if (event instanceof Event) {
            var ro = this._addRequest(0, callback, context, argument);
            ro.msg = event;
            event.addWaitList(ro);
        }
        else if (event instanceof Array) {
            for (var i = 0; i < event.length; i++) {
                var ro = this._addRequest(0, callback, context, argument);
                ro.msg = event[i];
                event[i].addWaitList(ro);
            }
        }
        return this;
    };
    ;
    Request.prototype.setData = function (data) {
        this.data = data;
        return this;
    };
    ;
    // Non Public API
    Request.prototype.deliver = function () {
        if (this.cancelled)
            return;
        this.cancel();
        if (!this.callbacks)
            return;
        if (this.group && this.group.length > 0) {
            this._doCallback(this.group[0].source, this.msg, this.group[0].data);
        }
        else {
            this._doCallback(this.source, this.msg, this.data);
        }
    };
    ;
    Request.prototype.cancelRenegeClauses = function () {
        //this.cancel = this.Null;
        //this.waitUntil = this.Null;
        //this.unlessEvent = this.Null;
        this.noRenege = true;
        if (!this.group || this.group[0] != this) {
            return;
        }
        for (var i = 1; i < this.group.length; i++) {
            this.group[i].cancelled = true;
            if (this.group[i].deliverAt == 0) {
                this.group[i].deliverAt = this.entity.time();
            }
        }
    };
    ;
    Request.prototype.Null = function () {
        return this;
    };
    ;
    // Private API
    Request.prototype._addRequest = function (deliverAt, callback, context, argument) {
        var ro = new Request(this.entity, this.scheduledAt, deliverAt);
        ro.callbacks.push([callback, context, argument]);
        if (this.group === null) {
            this.group = [this];
        }
        this.group.push(ro);
        ro.group = this.group;
        return ro;
    };
    ;
    Request.prototype._doCallback = function (source, msg, data) {
        for (var i = 0; i < this.callbacks.length; i++) {
            var callback = this.callbacks[i][0];
            if (!callback)
                continue;
            var context = this.callbacks[i][1];
            if (!context)
                context = this.entity;
            var argument = this.callbacks[i][2];
            context.callbackSource = source;
            context.callbackMessage = msg;
            context.callbackData = data;
            if (!argument) {
                callback.call(context);
            }
            else if (argument instanceof Array) {
                callback.apply(context, argument);
            }
            else {
                callback.call(context, argument);
            }
            context.callbackSource = null;
            context.callbackMessage = null;
            context.callbackData = null;
        }
    };
    ;
    return Request;
}());
var PQueue = /** @class */ (function () {
    function PQueue() {
        this.data = [];
        this.order = 0;
    }
    ;
    PQueue.prototype.greater = function (ro1, ro2) {
        if (ro1.deliverAt > ro2.deliverAt)
            return true;
        if (ro1.deliverAt == ro2.deliverAt)
            return ro1.order > ro2.order;
        return false;
    };
    ;
    /* Root at index 0
     * Parent (i) = Math.floor((i-1) / 2)
     * Left (i) = 2i + 1
     * Right (i) = 2i + 2
     */
    PQueue.prototype.insert = function (ro) {
        ARG_CHECK(arguments, 1, 1);
        ro.order = this.order++;
        var index = this.data.length;
        this.data.push(ro);
        // insert into data at the end
        var a = this.data;
        var node = a[index];
        // heap up
        while (index > 0) {
            var parentIndex = Math.floor((index - 1) / 2);
            if (this.greater(a[parentIndex], ro)) {
                a[index] = a[parentIndex];
                index = parentIndex;
            }
            else {
                break;
            }
        }
        a[index] = node;
    };
    ;
    PQueue.prototype.remove = function () {
        var a = this.data;
        var len = a.length;
        if (len <= 0) {
            return undefined;
        }
        if (len == 1) {
            return this.data.pop();
        }
        var top = a[0];
        // move the last node up
        a[0] = a.pop();
        len--;
        // heap down
        var index = 0;
        var node = a[index];
        while (index < Math.floor(len / 2)) {
            var leftChildIndex = 2 * index + 1;
            var rightChildIndex = 2 * index + 2;
            var smallerChildIndex = rightChildIndex < len
                && !this.greater(a[rightChildIndex], a[leftChildIndex])
                ? rightChildIndex : leftChildIndex;
            if (this.greater(a[smallerChildIndex], node)) {
                break;
            }
            a[index] = a[smallerChildIndex];
            index = smallerChildIndex;
        }
        a[index] = node;
        return top;
    };
    ;
    return PQueue;
}());
exports.PQueue = PQueue;
//# sourceMappingURL=SimEngine.js.map