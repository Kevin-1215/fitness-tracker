import { createRoot } from "react-dom/client";
import Demo from "./Demo";
import Review from "./Review";

createRoot(document.getElementById("root")!).render(new URLSearchParams(window.location.search).has("review")?<Review/>:<Demo/>);
