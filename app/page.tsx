import Landing from "@/components/Landing";

export default function Home() {
  return (
    <>
      <Landing />
      <footer className="footer">
        <div className="wrap footer__row">
          <div className="footer__links">
            <a href="mailto:shivangjani1601@gmail.com">email</a>
            <a
              href="https://wa.me/918770991417?text=Hi%20Shivang%20%E2%80%94%20I%20came%20across%20your%20portfolio%20and%20wanted%20to%20connect."
              target="_blank"
              rel="noopener noreferrer"
            >
              whatsapp
            </a>
            <a href="https://www.linkedin.com/in/shivang-jani/" target="_blank" rel="noopener noreferrer">
              linkedin
            </a>
            <a href="https://github.com/shivang-jani" target="_blank" rel="noopener noreferrer">
              github
            </a>
          </div>
          <span className="footer__note mono">© {new Date().getFullYear()} Shivang Jani</span>
        </div>
      </footer>
    </>
  );
}
