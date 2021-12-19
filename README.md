README

# Introduction

This is a reduced fork of sim.j with typescript types. It is modified in such a way that it can be used with asynchronous operation e.g. a server. This is done by recursevly calling setImmediate. In addtion, a library was added to handle time conversion. 

# How to use it

Install the module via npm
```
npm i -s simts
```

Give a a component the ISimEntity interface and/or let it inherit from the abstract class SimEntity. 
```
export class ProductionNetwork extends SimEntity
```
Then, an instance of the class must be registered to the engine as following:
```
import { Sim} from "simts";
sim = new Sim(); 
let productionNetwork = new ProductionNetwork();
sim.addEntity(productionNetwork); //Hereafter, the engine will call the start function of production network; When the start function is not overwriten, it will do nothing
```

The SimEntity class implements the following functions:
```
    time(): void;
    setTimer(duration: number): Request;
    waitEvent(event: Event): Request;
    queueEvent(event: Event): Request;
    send(message: String | number, delay: number, entities: any): void;
    log(message: string | number): void;
    start(): void;
    abstract sim: Sim;
    sendMessage(): void;
```

