import type { NextPage } from "next";
import Head from "next/head";
import * as fs from "fs";
import * as d3 from "d3";
import * as react from "react";

const svgWidth = 1500;
const svgHeight = 1000;

const simulation = d3
  .forceSimulation()
  .force("link", d3.forceLink())
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(svgWidth / 2, svgHeight / 2));

const dragStarted = (event: any, d: any) => {
  // どういうことなのか調べる
  if (!event.active) simulation.alphaTarget(0.3).restart();
};
const dragged = (event: any, d: any) => {
  d.fx = event.x;
  d.fy = event.y;
};
const dragEnded = (event: any, d: any) => {
  // どういうことなのか調べる
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
};

type LinkData = {
  from: FromLink;
  to: ToLink;
};

type FromLink = {
  path: string;
};

type ToLink = {
  path: string;
};

type Node = {
  label: string;
};

type Link = {
  source: number;
  target: number;
};

const buildData = (data: any[]) => {
  const nodeData: string[] = [];
  const linkData: Link[] = [];
  data.map((v, _) => {
    let fromPathIndex = nodeData.indexOf(v.from.path);
    let toPathIndex = nodeData.indexOf(v.to.path);
    if (fromPathIndex === -1) {
      nodeData.push(v.from.path);
      fromPathIndex = nodeData.length - 1;
    }
    if (toPathIndex === -1) {
      nodeData.push(v.to.path);
      toPathIndex = nodeData.length - 1;
    }
    console.log(fromPathIndex, toPathIndex);
    linkData.push({ source: fromPathIndex, target: toPathIndex });
  });

  return {
    nodeData: nodeData,
    linkData: linkData,
  };
};

const Home: NextPage = ({ data }: any) => {
  const ref = react.useRef(null);
  const parsedData = buildData(data);
  const linkData = parsedData.linkData;
  const nodeData: Node[] = parsedData.nodeData.map((v) => {
    return { label: v };
  });
  console.log(nodeData);
  console.log(linkData);

  react.useEffect(() => {
    const marker = d3
      .select(ref.current)
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("refX", 10)
      .attr("refY", 2)
      .attr("markerWidth", 30)
      .attr("markerHeight", 30)
      .attr("orient", "auto");
    // .attr({
    //   id: "arrowhead",
    //   refX: 0,
    //   refY: 2,
    //   markerWidth: 4,
    //   markerHeight: 4,
    //   orient: "auto",
    // });
    marker.append("path").attr("d", "M 0,0 V 10 L10,5 Z").attr("fill", "steelblue");

    const linkEntered = d3.select(ref.current).selectAll("link").data(linkData).enter();

    const link = linkEntered
      .append("line")
      .attr("stroke-width", 1)
      .attr("stroke-width", 1)
      .attr("stroke", "black")
      .attr("marker-end", "url(#arrowhead)");

    const nodeEntered = d3.select(ref.current).selectAll("circle").data(nodeData).enter().append("g");

    nodeEntered
      .append("rect")
      .attr("width", "15px")
      .attr("height", "15px")
      .call(d3.drag<SVGRectElement, any>().on("start", dragStarted).on("drag", dragged).on("end", dragEnded));

    nodeEntered
      .append("text")
      .attr("font-size", "10px")
      .attr("dx", -20)
      .text((d) => {
        return d.label;
      });

    const ticked = () => {
      link
        .attr("x1", function (d: any) {
          return d.source.x;
        })
        .attr("y1", function (d: any) {
          return d.source.y;
        })
        .attr("x2", function (d: any) {
          return d.target.x;
        })
        .attr("y2", function (d: any) {
          return d.target.y;
        });

      nodeEntered.attr("transform", function (d: any) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    };

    simulation.nodes(nodeData as d3.SimulationNodeDatum[]).on("tick", ticked);
    const forcedLink = simulation.force("link")! as any;
    forcedLink.links(linkData);
  }, [ref]);

  return (
    <div>
      <Head>
        <title>D3 Playground</title>
      </Head>

      <main>
        <svg ref={ref} width={svgWidth} height={svgHeight}></svg>
      </main>

      <footer></footer>
    </div>
  );
};

export async function getStaticProps() {
  const data = JSON.parse(fs.readFileSync("./data/deps.json", "utf-8"));
  return {
    props: {
      data,
    },
  };
}

export default Home;
