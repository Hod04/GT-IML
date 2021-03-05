import React from "react";
import {
  Button,
  HTMLSelect,
  Icon,
  Navbar,
  NavbarDivider,
  NavbarHeading,
  Switch,
} from "@blueprintjs/core";
import "../styles/NavBar.css";
import githubLogo from "../assets/images/github.jpg";
import { SharedTypes } from "../shared/sharedTypes";
import _ from "lodash";
import {
  CLUSTER_COMPACTNESS,
  PAIRWISE_CLUSTER_DISTANCE,
} from "../helpers/constants";

class NavBar extends React.Component<SharedTypes.NavBar.INavBarProps> {
  render() {
    return (
      <Navbar className={"gt-iml-navbar"}>
        <NavbarHeading>{"GT-IML"}</NavbarHeading>

        <NavbarDivider />

        <Switch
          className={"gt-iml-navbar-switch"}
          label={"Dynamic Graph"}
          checked={this.props.dynamicGraph}
          onChange={this.props.toggleDynamicGraph}
        />

        <Switch
          className={"gt-iml-navbar-switch"}
          label={"Show Edges"}
          checked={this.props.showEdges}
          onChange={this.props.toggleShowEdges}
        />

        <HTMLSelect
          style={{ marginLeft: 10 }}
          title={CLUSTER_COMPACTNESS.ClusterCompactness}
          defaultValue={CLUSTER_COMPACTNESS.ClusterCompactness}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            this.props.assignClusterCompactness(
              e.target.value as CLUSTER_COMPACTNESS
            )
          }
          minimal
          options={_.map(
            CLUSTER_COMPACTNESS,
            (compactnessOption) => compactnessOption
          )}
        />

        <HTMLSelect
          style={{ marginLeft: 10 }}
          title={PAIRWISE_CLUSTER_DISTANCE.PairwisseClusterDistance}
          defaultValue={PAIRWISE_CLUSTER_DISTANCE.PairwisseClusterDistance}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            this.props.assignPairwiseClusterDistance(
              e.target.value as PAIRWISE_CLUSTER_DISTANCE
            )
          }
          minimal
          options={_.map(
            PAIRWISE_CLUSTER_DISTANCE,
            (pairwiseDistanceOption) => pairwiseDistanceOption
          )}
        />

        <Button
          className={"gt-iml-navbar-button"}
          minimal
          onClick={() => window.location.reload()}
        >
          <Icon icon={"refresh"} />
          <span style={{ marginLeft: 10 }}>{"Refresh"}</span>
        </Button>

        <div className={"gt-iml-navbar-source-code"}>
          <Button
            className={"gt-iml-navbar-button"}
            minimal
            onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
              e.preventDefault();
              window.open("https://github.com/Hod04/GT-IML/", "_blank");
            }}
          >
            <div className={"gt-iml-navbar-github-content"}>
              <img
                className={"gt-iml-navbar-github-img"}
                src={githubLogo}
                alt={"Github Logo"}
              />
              {"Source Code"}
            </div>
          </Button>
        </div>
      </Navbar>
    );
  }
}

export default NavBar;
