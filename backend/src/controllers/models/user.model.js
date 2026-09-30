import mongoose, { Schema } from "mongoose";

const userSchema = new Schema (
    {
        name: {type: String, required: true },
        username: { type: String, required: true },
        password: { type: String, required: false },
        token: { type: String },
        picture: { type: String },
        githubToken: { type: String },
        githubLogin: { type: String },
        githubAvatar: { type: String }
    }
)

// Never serialize the GitHub access token into API responses.
userSchema.set("toJSON", {
    transform: (_document, returnedObject) => {
        delete returnedObject.githubToken;
        return returnedObject;
    }
});

const User = mongoose.model("User", userSchema);

export { User};
