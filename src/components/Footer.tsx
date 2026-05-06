import packageJson from '../../package.json';

export default function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Antonio Denilson Canuto</p>
      <p>Versão {packageJson.version}</p>
    </footer>
  );
}
