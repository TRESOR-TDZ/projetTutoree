import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, Spinner, Form, Alert } from "react-bootstrap";
import { Line, Doughnut } from "react-chartjs-2";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import api from "../../services/api";
import feather from "feather-icons"; // Import Feather Icons
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

export default function MedicalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("all");

  // État du thème (light / dark)
  const [theme, setTheme] = useState("light");

  // Détecte le thème au montage et sur changement du DOM
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(currentTheme);

    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute("data-theme") || "light";
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Mémorise la fonction, ne change que si selectedYear change.
  const fetchDashboardData = useCallback(async (year = selectedYear) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(
        `/admin-systeme/dashboard?year=${year}`
      );
      setData(data.data);
    } catch (err) {
      console.error("Erreur dashboard", err);
      setError("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  // Lance l’appel au montage et chaque fois que selectedYear évolue.
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Pour s'assurer que les icônes feather sont remplacées après les mises à jour du DOM
  useEffect(() => {
    feather.replace();
  }, [data, loading, error, theme]); // Dépendances ajoutées pour re-remplacer les icônes

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    // La fonction fetchDashboardData sera appelée par l'useEffect suite à la modification de selectedYear
  };

  // Props communes pour les Form Controls pour la gestion du thème
  const commonFormControlProps = {
    className: theme === "dark" ? "bg-dark text-light border-secondary" : "",
  };

  // Styles de base pour les cartes, adaptés pour le thème
  const commonCardProps = {
    className: `h-100 shadow-sm border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`,
  };


  if (loading) {
    return (
      <AdminSystemeLayout>
        <Container className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className={`mt-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>Chargement des données...</p>
        </Container>
      </AdminSystemeLayout>
    );
  }

  if (error) {
    return (
      <AdminSystemeLayout>
        <Container className="mt-5">
          <Alert variant="danger">
            <Alert.Heading>Erreur</Alert.Heading>
            <p>{error}</p>
          </Alert>
        </Container>
      </AdminSystemeLayout>
    );
  }

  if (!data) {
    return (
      <AdminSystemeLayout>
        <Container className="mt-5">
          <Alert variant="warning">
            <Alert.Heading>Aucune donnée</Alert.Heading>
            <p>Aucune donnée disponible pour le moment.</p>
          </Alert>
        </Container>
      </AdminSystemeLayout>
    );
  }

  // Données pour le graphique en courbes de l'évolution
  const evolutionChartData = {
    labels: data.monthly_evolution.map((item) => {
      const date = new Date(item.month + "-01");
      return date.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric"
      });
    }),
    datasets: [
      {
        label: "Patients",
        data: data.monthly_evolution.map((item) => item.patients),
        borderColor: "#E53E3E", // Rouge
        backgroundColor: "rgba(229, 62, 62, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Docteurs",
        data: data.monthly_evolution.map((item) => item.docteurs),
        borderColor: "#38A169", // Vert
        backgroundColor: "rgba(56, 161, 105, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Admin Structures",
        data: data.monthly_evolution.map((item) => item.admin_structures),
        borderColor: "#3182CE", // Bleu
        backgroundColor: "rgba(49, 130, 206, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Admin Système",
        data: data.monthly_evolution.map((item) => item.admin_systeme),
        borderColor: "#805AD5", // Violet
        backgroundColor: "rgba(128, 90, 213, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Configuration des options pour les graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
          color: theme === "dark" ? "#ffffff" : "#333333", // Couleur de la légende
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#2C5282",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)", // Couleur des grilles
          drawBorder: false,
        },
        ticks: {
          color: theme === "dark" ? "#ffffff" : "#333333", // Couleur des labels d'axe Y
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme === "dark" ? "#ffffff" : "#333333", // Couleur des labels d'axe X
        },
      },
    },
  };

  const structuresChartData = data.structures_with_users.map((s) => {
    const adminCount = parseInt(s.admin_count, 10) || 0;
    const doctorCount = parseInt(s.doctor_count, 10) || 0;
    const realTotal = adminCount + doctorCount;

    return {
      label: `${s.nom_structure} (${s.type_structure})`,
      realAdmin: adminCount,
      realDoctor: doctorCount,
      // 0.3 si pas de personnel, pour que le segment soit visible sur le donut chart
      chartValue: realTotal > 0 ? realTotal : 0.3,
    };
  });

  const doughnutData = {
    labels: structuresChartData.map((item) => item.label),
    datasets: [
      {
        label: "Personnel",
        data: structuresChartData.map((item) => item.chartValue),
        backgroundColor: [
          "#2C5282", "#3182CE", "#4299E1", "#63B3ED", "#90CDF4",
          "#BEE3F8", "#E6F3FF", "#1A365D", "#2A4A6B", "#4A90A4",
          "#E53E3E", "#F56565", "#FC8181", "#FEB2B2", "#FED7D7",
          "#38A169", "#48BB78", "#68D391", "#9AE6B4", "#C6F6D5",
          "#805AD5", "#9F7AEA", "#B794F6", "#D6BCFA", "#E9D8FD",
        ],
        borderColor: theme === "dark" ? "#333333" : "#ffffff", // Couleur de la bordure du donut
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 11 },
          color: theme === "dark" ? "#ffffff" : "#333333", // Couleur de la légende
        },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        callbacks: {
          // Affiche le total réel (0 ≠ 0.3)
          label: (context) => {
            const item = structuresChartData[context.dataIndex];
            const total = item.realAdmin + item.realDoctor;
            return `${item.label}: ${total} utilisateur${total > 1 ? "s" : ""}`;
          },
          afterLabel: (context) => {
            const item = structuresChartData[context.dataIndex];
            return [
              `Admins : ${item.realAdmin}`,
              `Docteurs : ${item.realDoctor}`,
            ];
          },
        },
      },
    },
  };

  return (
    <AdminSystemeLayout>
      <Container fluid className="py-4">
        {/* En-tête avec titre et sélecteur d'année */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                <i data-feather="activity" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Tableau de Bord
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Vue d'ensemble et statistiques clés de la plateforme.
                </p>
              </div>
            </div>
            <Form.Select
              value={selectedYear}
              onChange={handleYearChange}
              style={{ width: "180px" }}
              className={`shadow-sm ${commonFormControlProps.className}`}
            >
              {data.available_years.map((year) => (
                <option key={year} value={year}>
                  {year === 'all' ? 'Toutes les années' : year}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>

        {/* Cartes de résumé */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card {...commonCardProps} style={{ borderLeft: "4px solid #3182CE" }}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {data.total_structures}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Total Structures
                    </small>
                  </div>
                  <div className="text-primary">
                    <i data-feather="home" style={{ width: "24px", height: "24px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-3">
            <Card {...commonCardProps} style={{ borderLeft: "4px solid #E53E3E" }}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="mb-0 text-danger">
                      {data.users_by_role.Patients || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Patients
                    </small>
                  </div>
                  <div className="text-danger">
                    <i data-feather="users" style={{ width: "24px", height: "24px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-3">
            <Card {...commonCardProps} style={{ borderLeft: "4px solid #38A169" }}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="mb-0 text-success">
                      {data.users_by_role.Docteurs || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Docteurs
                    </small>
                  </div>
                  <div className="text-success">
                    <i data-feather="user-plus" style={{ width: "24px", height: "24px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-3">
            <Card {...commonCardProps} style={{ borderLeft: "4px solid #805AD5" }}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="mb-0 text-info">
                      {(data.users_by_role["Admin Structures"] || 0) +
                        (data.users_by_role["Admin Système"] || 0)}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Administrateurs
                    </small>
                  </div>
                  <div className="text-info">
                    <i data-feather="tool" style={{ width: "24px", height: "24px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Graphiques */}
        <Row>
          <Col md={6} className="mb-4">
            <Card {...commonCardProps}>
              <Card.Body>
                <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"} fw-bold`}>
                  <i data-feather="pie-chart" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                  Personnel par Structure
                </h5>
                <div style={{ height: "350px" }}>
                  {structuresChartData.length > 0 ? (
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100">
                      <i data-feather="alert-circle" className={`mb-3 ${theme === "dark" ? "text-light" : "text-muted"}`} style={{ width: "48px", height: "48px", opacity: 0.6 }}></i>
                      <p className={`text-center ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Aucune structure avec personnel disponible pour la période sélectionnée.
                      </p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} className="mb-4">
            <Card {...commonCardProps}>
              <Card.Body>
                <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"} fw-bold`}>
                  <i data-feather="activity" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                  Évolution des Inscriptions - {data.evolution_year}
                </h5>
                <div style={{ height: "350px" }}>
                  <Line data={evolutionChartData} options={chartOptions} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tableau des différentes structures répertoriées */}
        {/* {process.env.NODE_ENV === 'development' && ( */}
        <Row className="mt-4">
          <Col>
            <Card {...commonCardProps}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"} fw-bold`}>
                  <i data-feather="list" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                  Détails des Structures
                </h5>
              </Card.Header>
              <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                <div className="table-responsive">
                  <table className={`table table-sm align-middle ${theme === "dark" ? "table-dark" : ""}`}>
                    <thead className="table-primary">
                      <tr>
                        <th>
                          <i data-feather="home" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Structure
                        </th>
                        <th>
                          <i data-feather="tag" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Type
                        </th>
                        <th>
                          <i data-feather="user-check" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Admins
                        </th>
                        <th>
                          <i data-feather="user" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Docteurs
                        </th>
                        <th>
                          <i data-feather="users" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Total Personnel
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.structures_with_users.length > 0 ? (
                        data.structures_with_users.map((structure, index) => (
                          <tr key={index} className={theme === "dark" ? "border-secondary" : ""}>
                            <td>{structure.nom_structure}</td>
                            <td>{structure.type_structure}</td>
                            <td>{structure.admin_count}</td>
                            <td>{structure.doctor_count}</td>
                            <td>{parseInt(structure.admin_count) + parseInt(structure.doctor_count)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                              <i data-feather="info" className="mb-3" style={{ width: "32px", height: "32px", opacity: 0.5 }}></i>
                              <div>
                                <p className="small mb-0">Aucune structure avec des utilisateurs trouvée pour la période sélectionnée.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* )} */}
      </Container>
    </AdminSystemeLayout>
  );
}