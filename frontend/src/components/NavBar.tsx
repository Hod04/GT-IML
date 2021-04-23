import React from "react";
import {
  Button,
  HTMLSelect,
  Navbar,
  NavbarDivider,
  NavbarHeading,
  NumericInput,
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
import {
  assignClusterCompactnessActionCreator,
  assignKActionCreator,
  assignPairwiseClusterDistanceActionCreator,
  toggleAttributeWeightDialogActionCreator,
  toggleDynamicGraphActionCreator,
  toggleShowClusterCentroidsActionCreator,
  toggleShowEdgesActionCreator,
} from "../actions/actions";

class NavBar extends React.PureComponent<SharedTypes.NavBar.INavBarProps> {
  private dispatch = async (action: SharedTypes.App.IAction): Promise<void> =>
    await this.props.reducer(this.props.store, action);

  render() {
    return (
      <Navbar className={"gt-iml-navbar"}>
        <NavbarHeading>{"GT-IML"}</NavbarHeading>

        <NavbarDivider />

        <Switch
          className={"gt-iml-navbar-switch"}
          label={"Dynamic Graph"}
          checked={this.props.store.dynamicGraph}
          onChange={() => this.dispatch(toggleDynamicGraphActionCreator())}
        />

        <Switch
          className={"gt-iml-navbar-switch"}
          label={"Show Edges"}
          checked={this.props.store.showEdges}
          onChange={() => this.dispatch(toggleShowEdgesActionCreator())}
        />

        <Switch
          className={"gt-iml-navbar-switch"}
          label={"Show Cluster Centroids"}
          checked={this.props.store.showClusterCentroids}
          onChange={() =>
            this.dispatch(toggleShowClusterCentroidsActionCreator())
          }
        />

        <HTMLSelect
          style={{ marginLeft: 10 }}
          title={CLUSTER_COMPACTNESS.ClusterCompactness}
          defaultValue={CLUSTER_COMPACTNESS.ClusterCompactness}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            this.dispatch(
              assignClusterCompactnessActionCreator(
                e.target.value as CLUSTER_COMPACTNESS
              )
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
            this.dispatch(
              assignPairwiseClusterDistanceActionCreator(
                e.target.value as PAIRWISE_CLUSTER_DISTANCE
              )
            )
          }
          minimal
          options={_.map(
            PAIRWISE_CLUSTER_DISTANCE,
            (pairwiseDistanceOption) => pairwiseDistanceOption
          )}
        />

        <>
          <NumericInput
            min={2}
            max={15}
            clampValueOnBlur
            defaultValue={this.props.store.k}
            onValueChange={(valueAsNumber: number) => {
              if (!(valueAsNumber <= 16 && valueAsNumber >= 2)) {
                return;
              }
              this.dispatch(assignKActionCreator(valueAsNumber));
            }}
            value={this.props.store.k}
            style={{ width: 35, marginLeft: 30 }}
          />
          <span style={{ marginLeft: 10 }}>{"k [2, 15]"}</span>
        </>

        <Button
          className={"gt-iml-navbar-button"}
          minimal
          onClick={() =>
            this.dispatch(toggleAttributeWeightDialogActionCreator())
          }
        >
          {"Attribute Weight"}
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
