
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('network');
    const detailsPanel = document.getElementById('details-panel');

    fetch('graph_data.json')
        .then(response => response.json())
        .then(data => {
            const nodes = new vis.DataSet(data.nodes);
            const edges = new vis.DataSet(data.edges);

            const networkData = {
                nodes: nodes,
                edges: edges,
            };

            const options = {
                interaction: { hover: true },
                physics: {
                    enabled: true,
                    barnesHut: {
                        gravitationalConstant: -80000,
                        springConstant: 0.04,
                        springLength: 200
                    },
                    stabilization: {
                        iterations: 2500
                    }
                },
                nodes: {
                    shape: 'box',
                    font: {
                        size: 14,
                        face: 'arial',
                    },
                },
                edges: {
                    font: {
                        size: 12,
                        face: 'arial',
                        align: 'middle',
                    },
                    arrows: {
                        to: { enabled: true, scaleFactor: 1 },
                    },
                },
            };

            const network = new vis.Network(container, networkData, options);

            network.on("stabilizationIterationsDone", function () {
                network.setOptions( { physics: false } );
            });

            network.on("click", function (params) {
                const allNodes = nodes.get({ returnType: "Object" });

                // If a node is clicked, highlight the connected chain
                if (params.nodes.length > 0) {
                    const selectedNodeId = params.nodes[0];
                    const node = nodes.get(selectedNodeId);
                    displayNodeDetails(node);

                    // Dim all nodes and edges
                    const dimColor = 'rgba(200,200,200,0.2)';
                    const nodesToUpdate = [];
                    nodes.forEach(node => {
                        nodesToUpdate.push({id: node.id, color: { border: dimColor, background: dimColor }, font: { color: dimColor }});
                    });
                    nodes.update(nodesToUpdate);

                    const edgesToUpdate = [];
                    edges.forEach(edge => {
                        edgesToUpdate.push({id: edge.id, color: dimColor, font: { color: dimColor }});
                    });
                    edges.update(edgesToUpdate);

                    // Highlight the selected node and its connections
                    const selectedColor = { border: '#2B7CE9', background: '#D2E5FF' };
                    const inputColor = { border: '#4AD964', background: '#C8F7C5' }; // Green
                    const outputColor = { border: '#FF9500', background: '#FFDAB9' }; // Orange
                    const highlightFont = { color: '#343434' };
                    const highlightEdgeColor = '#848484';

                    // Highlight the selected node
                    nodes.update({ id: selectedNodeId, color: selectedColor, font: highlightFont });

                    // Highlight connected nodes and edges
                    const connectedEdges = network.getConnectedEdges(selectedNodeId);
                    const connectedNodesUpdate = [];
                    const connectedEdgesUpdate = [];

                    connectedEdges.forEach(edgeId => {
                        const edge = edges.get(edgeId);
                        let connectedNodeId;
                        if (edge.from === selectedNodeId) { // Output edge
                            connectedNodeId = edge.to;
                            connectedNodesUpdate.push({ id: connectedNodeId, color: outputColor, font: highlightFont });
                        } else { // Input edge
                            connectedNodeId = edge.from;
                            connectedNodesUpdate.push({ id: connectedNodeId, color: inputColor, font: highlightFont });
                        }
                        connectedEdgesUpdate.push({ id: edgeId, color: highlightEdgeColor, font: highlightFont });
                    });

                    nodes.update(connectedNodesUpdate);
                    edges.update(connectedEdgesUpdate);

                } else {
                    // Clicked on the canvas, so reset all nodes and edges
                    const nodesToUpdate = [];
                    nodes.forEach(node => {
                        nodesToUpdate.push({id: node.id, color: { border: '#2B7CE9', background: '#97C2FC' }, font: { color: '#343434' }});
                    });
                    nodes.update(nodesToUpdate);

                    const edgesToUpdate = [];
                    edges.forEach(edge => {
                        edgesToUpdate.push({id: edge.id, color: '#848484', font: { color: '#343434' }});
                    });
                    edges.update(edgesToUpdate);

                    detailsPanel.innerHTML = '<h2>Select a facility to see details</h2>';
                }
            });

            function displayNodeDetails(node) {
                let detailsHTML = `<h2>${node.label}</h2>`;
                if (node.location) {
                    detailsHTML += `<p><strong>Location:</strong> ${node.location}</p>`;
                }

                if (node.production_tables && node.production_tables.length > 0) {
                    detailsHTML += '<h3>Production</h3>';
                    node.production_tables.forEach(table => {
                        detailsHTML += '<table>';
                        detailsHTML += '<tr><th>Input</th><th>Output</th><th>Process Time</th><th>Output Capacity</th></tr>';
                        
                        const inputName = table.Input && table.Input[0] ? `${table.Input[0].amount}x ${table.Input[0].name}` : 'N/A';
                        const outputName = table.Output && table.Output.name ? `${table.Output.amount}x ${table.Output.name}` : 'N/A';

                        detailsHTML += `<tr>
                            <td>${inputName}</td>
                            <td>${outputName}</td>
                            <td>${table["Process Time"] || 'N/A'}</td>
                            <td>${table["Output Capacity"] || 'N/A'}</td>
                        </tr>`;
                        detailsHTML += '</table>';
                    });
                }
                detailsPanel.innerHTML = detailsHTML;
            }
        });
});
