#include <iostream>
#include <string>
#include <vector>
#include <napi.h>
using namespace std;

// Missing Base Class Inheritance:
class QueueWrapper: public Napi::ObjectWrap<QueueWrapper> {
    private:
    vector<string> buffer;
    int head, tail, count, capacity;

    public:
    // constructor
    QueueWrapper(const Napi::CallbackInfo& info): Napi::ObjectWrap<QueueWrapper>(info) { 
        Napi::Env env = info.Env();
        capacity = ( info.Length() > 0 && info[0].IsNumber()) ? info[0].As<Napi::Number>().Int32Value() : 1000;
        head = 0;
        tail = 0;
        count = 0; 
        buffer.resize(capacity);
    }

    // methods
    // Accepts a JSON string or job payload.
    Napi::Value push(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        if ( info.Length() < 1 || !info[0].IsString()) { 
            Napi::TypeError::New(env, "string expected for job payload").ThrowAsJavaScriptException();
            return env.Null();
        }

        if ( count == capacity ) {
            return Napi::Boolean::New(env, false);
        }

        string item = info[0].As<Napi::String>().Utf8Value();

        buffer[tail] = item;
        tail = (tail + 1) % capacity;
        count++;

        return Napi::Boolean::New(env, true);
    }

    // Removes and returns the job at head.
    Napi::Value pop(const Napi::CallbackInfo& info ) {
        Napi::Env env = info.Env();

        // if queue is empty
        if ( count == 0 ) { 
            return env.Null();
        } 

        string item = buffer[head];

        head = ( head + 1 ) % capacity; 
        count--;

        // return to JS
        return Napi::String::New(env, item);
    }

    // Returns the element at head without removing it.
    Napi::Value peek(const Napi::CallbackInfo& info) { 
        Napi::Env env = info.Env();

        if ( count == 0 ) { 
            return env.Null();
        }

        string item = buffer[head];

        // return to JS
        return Napi::String::New(env, item);
    }

    // Returns count.
    Napi::Value size(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        return Napi::Number::New(env, count);
    }

    // Returns count == 0.
    Napi::Value IsEmpty(const Napi::CallbackInfo& info) { 
        Napi::Env env = info.Env();

        return Napi::Boolean::New(env, count == 0);
    }

    // Binds the class methods so Node.js can instantiate it as new Queue(capacity)
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "Queue", {
            InstanceMethod("push", &QueueWrapper::push),
            InstanceMethod("pop", &QueueWrapper::pop),
            InstanceMethod("peek", &QueueWrapper::peek),
            InstanceMethod("size", &QueueWrapper::size),
            InstanceMethod("isEmpty", &QueueWrapper::IsEmpty),
        });

        exports.Set("Queue", func);
        return exports;
    }
};

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
return QueueWrapper::Init(env, exports);
}

NODE_API_MODULE(queue_native, InitAll);