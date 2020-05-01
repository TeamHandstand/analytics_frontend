import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  TextField,
  Grid,
  Paper,
  Button,
  Typography,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  CircularProgress,
  Modal,
  IconButton,
  Snackbar,
  SnackbarContent
} from "@material-ui/core";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import { defaultTheme } from "./defaultTheme";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import InfoIcon from "@material-ui/icons/Info";
import WarningIcon from "@material-ui/icons/Warning";

function App() {
  const proxyUrl = "https://cors-anywhere.herokuapp.com/";
  const headers = {
    authToken: "67577065-4b78-494d-b1c7-4f2c92ef795d",
    userId: "635A39B5-8C7A-45FB-A44F-388354EB4890",
    mobile: "glevy11"
  };
  const [eventId, setEventId] = React.useState("");
  const [selectedRiddleId, setSelectedRiddleId] = React.useState("");
  const [badgeRiddles, setBadgeRiddles] = React.useState([]);
  const [teams, setTeams] = React.useState([]);
  const [selectedSubmission, setSelectedSubmission] = React.useState({});
  const [snackbarContent, setSnackbarContent] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmissionLoading, setIsSubmissionLoading] = React.useState(false);
  const [isMatchupLoading, setIsMatchupLoading] = React.useState(false);
  const [isTeamLoading, setIsTeamLoading] = React.useState(false);
  const [isUrlLoading, setIsUrlLoading] = React.useState(false);
  const [isActiveLoading, setIsActiveLoading] = React.useState(false);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [activeModalOpen, setActiveModalOpen] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  const [mediaUrl, setMediaUrl] = React.useState("");
  const theme = createMuiTheme(defaultTheme);

  const useStyles = makeStyles({
    container: {
      backgroundColor: "black",
      height: "100%",
      width: "100%"
    },
    paper: {
      padding: "16px"
    },
    errorIcon: { color: "red" },
    header: {
      display: "flex",
      alignContent: "center",
      marginBottom: "8px"
    },
    overview: {
      display: "flex",
      justifyContent: "space-evenly"
    },
    submissionHeader: {
      display: "flex",
      justifyContent: "space-between"
    },
    table: {},
    badgeName: {
      fontWeight: "bold"
    },
    validatedIcon: {
      color: "green"
    },
    badgeInfo: {
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "18%",
      padding: "4px"
    },
    selectedBadge: {
      backgroundColor: "pink"
    },
    icon: {
      height: "70px",
      width: "auto"
    },
    textContainer: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%"
    },
    teamImage: {
      width: "30px",
      height: "auto"
    },
    activeCircle: {
      background:
        "radial-gradient(circle, rgba(130, 255, 147, 1) 3%, rgba(6, 172, 20, 1) 84%)",
      borderRadius: "50%",
      height: "30px",
      width: "30px",
      cursor: "pointer"
    },
    nonActiveCircle: {
      background:
        "radial-gradient(circle, rgba(255, 130, 130, 1) 3%, rgba(172, 6, 6, 1) 84%)"
    },
    modal: {
      position: "absolute",
      width: "70vw",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: theme.palette.background.paper,
      border: "2px solid #000",
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column"
    },
    confirmActiveButton: {
      borderColor: selectedSubmission.active === false ? "green" : "red"
    },
    errorSnack: {
      color: theme.palette.error.dark
    }
  });
  const classes = useStyles();

  const handleEventIdChange = e => {
    setEventId(e.target.value);
  };

  const fetchDataForEventId = () => {
    const url = `https://api.handstandwith.us/v2/events/${eventId}/event_badges`;
    setIsLoading(true);
    fetch(proxyUrl + url, {
      headers
    })
      .then(response => response.json())
      .then(json => {
        let mappedBadges = json.map(badge => {
          const votableRiddle = badge.eventRiddles.filter(
            er => er.isVotable
          )[0];
          if (votableRiddle) {
            return {
              name: badge.name,
              image: badge.imageUrl,
              riddle: votableRiddle
            };
          }
        });

        for (const badge in mappedBadges) {
          const currentBadge = mappedBadges[badge];
          const submissionUrl = `https://api.handstandwith.us/v2/events/${eventId}/event_riddles/${currentBadge.riddle.id}/submissions`;
          setIsSubmissionLoading(true);
          fetch(proxyUrl + submissionUrl, {
            headers
          })
            .then(res => res.json())
            .then(json => {
              const total =
                json.submissions.reduce(
                  (acc, c) => acc + c.numScoredMatchups,
                  0
                ) / 2;

              const average = (total / json.submissions.length).toFixed(1);
              mappedBadges[badge] = {
                ...currentBadge,
                submissions: json.submissions.sort((x, y) => {
                  const diff = y.eloScore - x.eloScore;
                  if (diff !== 0) {
                    return diff;
                  }
                  return y.numScoredMatchups - x.numScoredMatchups;
                }),
                submissionTotal: json.submissions.length,
                averageNumMatchups: average,
                voteTotal: total
              };
              setBadgeRiddles(
                mappedBadges.filter(badge => badge !== undefined)
              );
              setIsSubmissionLoading(false);
            })
            .catch(error => {
              setIsSubmissionLoading(false);
              console.log("Error fetching submission data:", error);
              setSnackbarContent(error.toString());
              setSnackbarOpen(true);
            });
        }
        setBadgeRiddles(mappedBadges.filter(badge => badge !== undefined));
        setIsLoading(false);
      })
      .catch(error => {
        console.log("ERROR FETCHING BADGE DATA: ", error);
        setSnackbarContent(error.toString());
        setSnackbarOpen(true);
        setIsLoading(false);
      });
  };

  const handleEventIdButtonClick = () => {
    setSelectedRiddleId("");
    fetchTeamInfoForEventId();
    fetchDataForEventId();
  };

  const handleBadgeClick = riddleId => {
    setSelectedRiddleId(riddleId);
    fetchMatchupsForRiddleId(riddleId);
  };

  const fetchMatchupsForRiddleId = riddleId => {
    const matchupUrl = `https://api.handstandwith.us/v2/events/${eventId}/event_riddles/${riddleId}/matchups`;
    setIsMatchupLoading(true);
    fetch(proxyUrl + matchupUrl, {
      headers
    })
      .then(res => res.json())
      .then(json => {
        let mappedBadges = badgeRiddles.map(br => {
          let mappedSubmissions = br?.submissions.map(sub => {
            const wins = json.matchups.filter(
              matchup => matchup.winningSubmissionId === sub.id
            ).length;
            const losses = json.matchups.filter(
              matchup =>
                matchup.winningSubmissionId !== sub.id &&
                matchup.winningSubmissionId !== null &&
                (matchup.submissionAId === sub.id ||
                  matchup.submissionBId === sub.id)
            ).length;
            return { ...sub, wins, losses };
          });
          return {
            ...br,
            submissions: mappedSubmissions
          };
        });
        setIsMatchupLoading(false);
        setBadgeRiddles(mappedBadges.filter(badge => badge !== undefined));
      })
      .catch(error => {
        setIsMatchupLoading(false);
        console.log("Error fetching matchup data:", error);
        setSnackbarContent(error.toString());
        setSnackbarOpen(true);
      });
  };

  const fetchTeamInfoForEventId = () => {
    setIsTeamLoading(true);
    const url = `https://api.handstandwith.us/v2/events/${eventId}/teams`;
    setIsMatchupLoading(true);
    fetch(proxyUrl + url, {
      headers
    })
      .then(res => res.json())
      .then(json => {
        setTeams(json.teams);
        setIsTeamLoading(false);
      })
      .catch(error => {
        setIsTeamLoading(false);
        console.log("Error fetching team data:", error);
        setSnackbarContent(error.toString());
        setSnackbarOpen(true);
      });
  };

  const handleRefreshClick = () => {
    handleEventIdButtonClick();
  };

  const handlePlayIconClick = mediaUrl => {
    setMediaUrl(mediaUrl);
    setModalOpen(true);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter") {
      handleEventIdButtonClick();
    }
  };

  const checkUrl = url => {
    var http = new XMLHttpRequest();

    http.open("HEAD", proxyUrl + url, false);
    http.send();

    return http.status != 404 && http.status != 403;
  };

  const checkAllUrls = (brs = badgeRiddles) => {
    setIsUrlLoading(true);
    let mappedBadgeRiddles = brs.map(br => {
      if (br.riddle.id !== selectedRiddleId) {
        return br;
      }
      let mappedSubmissions = br.submissions.map(sub => {
        if (sub.isVideoReachable === true || sub.isVideoReachable === false) {
          return sub;
        }
        const isVideoReachable = checkUrl(sub.solvedRiddle.mediaUrl);
        return {
          ...sub,
          isVideoReachable
        };
      });
      return {
        ...br,
        submissions: mappedSubmissions
      };
    });
    setBadgeRiddles(mappedBadgeRiddles);
    setIsUrlLoading(false);
  };

  const handleValidateButtonClick = () => {
    validateMedia();
  };

  const validateMedia = (brs = badgeRiddles) => {
    setIsUrlLoading(true);
    setTimeout(() => {
      checkAllUrls(brs);
    }, 300);
  };

  const handleActiveCircleClick = submission => {
    setSelectedSubmission(submission);
    setActiveModalOpen(true);
  };

  const handleDetailModalButtonClick = submission => {
    setSelectedSubmission(submission);
    setDetailModalOpen(true);
  };

  const handleConfirmActiveButtonClick = () => {
    setIsActiveLoading(true);
    const url = `https://api.handstandwith.us/v2/events/${eventId}/event_riddles/${
      selectedSubmission.solvedRiddle.eventRiddleId
    }/submissions/${selectedSubmission.id}/${
      selectedSubmission.active === false ? "activate" : "deactivate"
    }`;
    fetch(proxyUrl + url, {
      headers,
      method: "PUT"
    })
      .then(res => res.json())
      .then(json => {
        let mappedBadgeRiddles = badgeRiddles.map(br => {
          let mappedSubmissions = br.submissions.map(sub => {
            if (sub.id !== selectedSubmission.id) {
              return sub;
            }
            return {
              ...sub,
              active: !sub.active
            };
          });
          return {
            ...br,
            submissions: mappedSubmissions
          };
        });
        setBadgeRiddles(mappedBadgeRiddles);
        setIsActiveLoading(false);
        setActiveModalOpen(false);
      })
      .catch(error => {
        setIsActiveLoading(false);
        console.log("Error activating/deactivating data:", error);
        setSnackbarContent(error.toString());
        setSnackbarOpen(true);
      });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.container}>
        <Paper className={classes.paper}>
          <Grid container>
            <Grid item xs={12} className={classes.header}>
              <TextField
                variant="outlined"
                onChange={handleEventIdChange}
                onKeyDown={handleKeyDown}
                value={eventId}
                label={"Event ID or Slug"}
              />
              <Button variant="outlined" onClick={handleEventIdButtonClick}>
                {isLoading ? <CircularProgress size={20} /> : "Go"}
              </Button>
              <Button variant="outlined" onClick={handleRefreshClick}>
                {isLoading ? <CircularProgress size={20} /> : "Refresh"}
              </Button>
            </Grid>
            {!isLoading && (
              <Grid item xs={12}>
                <Grid container className={classes.overview}>
                  {badgeRiddles.map(br => {
                    return (
                      <Grid
                        key={br.riddle.id}
                        item
                        className={`${classes.badgeInfo} ${br?.riddle?.id ===
                          selectedRiddleId && classes.selectedBadge}`}
                        onClick={() => {
                          handleBadgeClick(br?.riddle?.id);
                        }}
                      >
                        <img className={classes.icon} src={br.image} />
                        <Typography className={classes.badgeName}>
                          {br.name}
                        </Typography>
                        <div className={classes.textContainer}>
                          <Typography># Subs: </Typography>
                          {isSubmissionLoading ? (
                            <CircularProgress size={10} />
                          ) : (
                            <Typography>{br.submissionTotal}</Typography>
                          )}
                        </div>
                        <div className={classes.textContainer}>
                          <Typography># Votes: </Typography>
                          {isSubmissionLoading ? (
                            <CircularProgress size={10} />
                          ) : (
                            <Typography>{br.voteTotal}</Typography>
                          )}
                        </div>
                        <div className={classes.textContainer}>
                          <Typography>Avg Matchup: </Typography>
                          {isSubmissionLoading ? (
                            <CircularProgress size={10} />
                          ) : (
                            <Typography>{br.averageNumMatchups}</Typography>
                          )}
                        </div>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            )}
            {!isLoading && badgeRiddles.length > 0 && selectedRiddleId && (
              <Grid container>
                <Grid item xs={12} className={classes.submissionHeader}>
                  <Typography variant={"h4"}>Submissions</Typography>
                  <Button
                    variant="outlined"
                    onClick={handleValidateButtonClick}
                  >
                    Validate Media
                  </Button>
                </Grid>
                <Grid item xs={12} className={classes.table}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ranking</TableCell>
                        <TableCell>Info</TableCell>
                        <TableCell>Team Image</TableCell>
                        <TableCell>Team Name</TableCell>
                        <TableCell>Elo Rating</TableCell>
                        <TableCell>Points Awarded</TableCell>
                        <TableCell>Media URL</TableCell>
                        <TableCell>Wins</TableCell>
                        <TableCell>Losses</TableCell>
                        <TableCell>Active</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {badgeRiddles
                        .find(br => br.riddle.id === selectedRiddleId)
                        ?.submissions?.map((submission, index) => {
                          return (
                            <TableRow key={submission.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <IconButton
                                  onClick={() => {
                                    handleDetailModalButtonClick(submission);
                                  }}
                                >
                                  <InfoIcon />
                                </IconButton>
                              </TableCell>
                              <TableCell>
                                <img
                                  className={classes.teamImage}
                                  src={
                                    teams?.find(
                                      team =>
                                        team.id ===
                                        submission.solvedRiddle.teamId
                                    )?.imageUrl
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                {teams?.find(
                                  team =>
                                    team.id === submission.solvedRiddle.teamId
                                )?.name || "<Team Deleted>"}
                              </TableCell>
                              <TableCell>{submission.eloScore}</TableCell>
                              <TableCell>
                                {submission.solvedRiddle.pointsAwarded}
                              </TableCell>
                              <TableCell>
                                {isUrlLoading ? (
                                  <CircularProgress size={10} />
                                ) : submission.isVideoReachable === false ? (
                                  <IconButton
                                    onClick={() => {
                                      handlePlayIconClick(
                                        submission.solvedRiddle.mediaUrl
                                      );
                                    }}
                                  >
                                    <ErrorOutlineIcon
                                      className={classes.errorIcon}
                                    />
                                  </IconButton>
                                ) : (
                                  <IconButton
                                    className={`${submission.isVideoReachable ===
                                      true && classes.validatedIcon}`}
                                    onClick={() => {
                                      handlePlayIconClick(
                                        submission.solvedRiddle.mediaUrl
                                      );
                                    }}
                                  >
                                    <PlayCircleOutlineIcon />
                                  </IconButton>
                                )}
                              </TableCell>
                              <TableCell>
                                {isMatchupLoading ? (
                                  <CircularProgress size={10} />
                                ) : (
                                  submission.wins
                                )}
                              </TableCell>
                              <TableCell>
                                {isMatchupLoading ? (
                                  <CircularProgress size={10} />
                                ) : (
                                  submission.losses
                                )}
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  onClick={() => {
                                    handleActiveCircleClick(submission);
                                  }}
                                >
                                  <div
                                    className={`${
                                      classes.activeCircle
                                    } ${submission.active === false &&
                                      classes.nonActiveCircle}`}
                                  />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Paper>
        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
          }}
        >
          <div className={classes.modal}>
            <video controls src={mediaUrl} />
          </div>
        </Modal>
        <Modal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
          }}
        >
          <div className={classes.modal}>
            <Typography variant="h4">ID: {selectedSubmission.id}</Typography>
            <div>{JSON.stringify(selectedSubmission, undefined, 8)}</div>
          </div>
        </Modal>
        <Modal
          open={activeModalOpen}
          onClose={() => {
            setActiveModalOpen(false);
          }}
        >
          <div className={classes.modal}>
            <Typography variant="h5">
              Are you sure you want to{" "}
              {selectedSubmission.active === false ? "activate" : "deactivate"}{" "}
              this submission?
            </Typography>
            <Button
              variant="outlined"
              onClick={handleConfirmActiveButtonClick}
              className={classes.confirmActiveButton}
            >
              {isActiveLoading ? <CircularProgress /> : "Confirm"}
            </Button>
          </div>
        </Modal>
        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left"
          }}
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <SnackbarContent
            className={classes.errorSnack}
            message={
              <span id="client-snackbar" className={classes.message}>
                <WarningIcon />
                {snackbarContent}
              </span>
            }
          />
        </Snackbar>
      </div>
    </ThemeProvider>
  );
}

export default App;
