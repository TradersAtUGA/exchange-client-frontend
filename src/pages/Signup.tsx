import React, { useState } from "react";
import "./Signup.css"; 
import axios from "axios";

export default function Signup(){

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading ] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");


    const passwordValidation = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordValidation.test(password)) {
        setError("Password must be at least 8 characters long, contain one uppercase letter, and one special character.");
        setLoading(false);
        return;
    }

    try {
        const response = await axios.post("http://localhost:8000/signup", { email, password });
        const { access_token } = response.data;

        if (response.status === 200 && access_token) {
        localStorage.setItem("access_token", access_token);
        window.location.href = "/orderbook"; 
        }
    } catch (err) {
        setError("Server is unavailable");
    } finally {
        setLoading(false);
    }
    };
    // todo complete
    return(
        <div className ="sign-up-container">
        <form className="signup-form" onSubmit={handleSubmit}>
            <h1>Sign up</h1>


        </form>
        </div>

    );


}