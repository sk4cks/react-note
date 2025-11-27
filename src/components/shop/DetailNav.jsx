import { Nav } from "react-bootstrap";

const DetailNav = ({ content, tabState, setTabState }) => {
    
    return (
        <>
            <Nav variant="tabs" defaultActiveKey="link0">
                <Nav.Item>
                    <Nav.Link
                        onClick={() => {
                            setTabState(0);
                        }}
                        eventKey="link0"
                    >
                        버튼0
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        onClick={() => {
                            setTabState(1);
                        }}
                        eventKey="link1"
                    >
                        버튼1
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        onClick={() => {
                            setTabState(2);
                        }}
                        eventKey="link2"
                    >
                        버튼2
                    </Nav.Link>
                </Nav.Item>
            </Nav>
            {content[tabState]}
        </>
    );
};

export default DetailNav;